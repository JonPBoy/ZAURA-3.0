#!/usr/bin/env python3
"""
Backend API test suite for Zaura app - Oracle Chat and Bond Story endpoints
Tests Oracle Chat (GET/POST/DELETE /api/oracle) and Bond Story (GET/POST /api/bond-story)
"""

import requests
import time
import sys
import os

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://soul-compass-58.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
LUNA_EMAIL = "luna@zaura.app"
LUNA_PASSWORD = "cosmic123"
NOVA_EMAIL = "nova@zaura.app"
NOVA_PASSWORD = "cosmic123"

# Test counters
tests_passed = 0
tests_failed = 0

def test(name, condition, error_msg=""):
    """Helper to track test results"""
    global tests_passed, tests_failed
    if condition:
        tests_passed += 1
        print(f"✅ {name}")
        return True
    else:
        tests_failed += 1
        print(f"❌ {name}")
        if error_msg:
            print(f"   Error: {error_msg}")
        return False

def login(email, password):
    """Login and return token"""
    resp = requests.post(f"{API_URL}/auth/login", json={"email": email, "password": password})
    if resp.status_code == 200:
        return resp.json().get('token')
    return None

def register_throwaway():
    """Register a throwaway user and return token"""
    import uuid
    email = f"throwaway_{uuid.uuid4().hex[:8]}@test.com"
    resp = requests.post(f"{API_URL}/auth/register", json={
        "email": email,
        "password": "test123",
        "name": "Throwaway User"
    })
    if resp.status_code == 201:
        return resp.json().get('token'), email
    return None, None

print("\n" + "="*80)
print("ZAURA BACKEND TEST - ORACLE CHAT & BOND STORY ENDPOINTS")
print("="*80 + "\n")

# ============================================================================
# A) ORACLE CHAT TESTS
# ============================================================================
print("\n--- A) ORACLE CHAT TESTS ---\n")

# Test A1: GET /api/oracle as nova -> 200, {messages:[4 items], sessionId}
print("Test A1: GET /api/oracle as nova (existing 4-message session)")
nova_token = login(NOVA_EMAIL, NOVA_PASSWORD)
if nova_token:
    resp = requests.get(f"{API_URL}/oracle", headers={"Authorization": f"Bearer {nova_token}"})
    test("A1.1: GET /api/oracle returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        messages = data.get('messages', [])
        session_id = data.get('sessionId')
        test("A1.2: Response has messages array", isinstance(messages, list), f"Got {type(messages)}")
        test("A1.3: Messages array has 4 items", len(messages) == 4, f"Got {len(messages)} messages")
        
        if len(messages) > 0:
            msg = messages[0]
            test("A1.4: Message has 'id' field", 'id' in msg, f"Keys: {msg.keys()}")
            test("A1.5: Message has 'role' field", 'role' in msg, f"Keys: {msg.keys()}")
            test("A1.6: Message has 'text' field", 'text' in msg, f"Keys: {msg.keys()}")
            test("A1.7: Message has 'createdAt' field", 'createdAt' in msg, f"Keys: {msg.keys()}")
            test("A1.8: Message has no '_id' field", '_id' not in msg, "Found MongoDB _id")
            
            # Check alternating roles
            roles = [m.get('role') for m in messages]
            expected_roles = ['user', 'assistant', 'user', 'assistant']
            test("A1.9: Messages have alternating user/assistant roles", roles == expected_roles, f"Got roles: {roles}")
        
        test("A1.10: Response has sessionId", session_id is not None, "sessionId is None")
else:
    print("❌ Failed to login as nova@zaura.app")
    tests_failed += 10

# Test A2: GET/POST /api/oracle without token -> 401
print("\nTest A2: GET/POST /api/oracle without token -> 401")
resp = requests.get(f"{API_URL}/oracle")
test("A2.1: GET /api/oracle without token returns 401", resp.status_code == 401, f"Got {resp.status_code}")

resp = requests.post(f"{API_URL}/oracle", json={"message": "hello"})
test("A2.2: POST /api/oracle without token returns 401", resp.status_code == 401, f"Got {resp.status_code}")

# Test A3: POST /api/oracle validation (empty message, too long message)
print("\nTest A3: POST /api/oracle validation")
luna_token = login(LUNA_EMAIL, LUNA_PASSWORD)
if luna_token:
    # Empty message
    resp = requests.post(f"{API_URL}/oracle", 
                        headers={"Authorization": f"Bearer {luna_token}"},
                        json={"message": ""})
    test("A3.1: POST /api/oracle with empty message returns 400", resp.status_code == 400, f"Got {resp.status_code}")
    
    # Too long message (>1000 chars)
    resp = requests.post(f"{API_URL}/oracle",
                        headers={"Authorization": f"Bearer {luna_token}"},
                        json={"message": "x" * 1001})
    test("A3.2: POST /api/oracle with >1000 char message returns 400", resp.status_code == 400, f"Got {resp.status_code}")
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 2

# Test A4: POST /api/oracle without profile -> 404
print("\nTest A4: POST /api/oracle without profile -> 404")
throwaway_token, throwaway_email = register_throwaway()
if throwaway_token:
    resp = requests.post(f"{API_URL}/oracle",
                        headers={"Authorization": f"Bearer {throwaway_token}"},
                        json={"message": "hello"})
    test("A4.1: POST /api/oracle without profile returns 404", resp.status_code == 404, f"Got {resp.status_code}")
    if resp.status_code == 404:
        error_msg = resp.json().get('error', '')
        test("A4.2: Error message mentions profile", 'profile' in error_msg.lower(), f"Got: {error_msg}")
else:
    print("❌ Failed to register throwaway user")
    tests_failed += 2

# Test A5: POST /api/oracle as luna (ONE allowed LLM call)
print("\nTest A5: POST /api/oracle as luna (ONE LLM call allowed)")
if luna_token:
    start_time = time.time()
    resp = requests.post(f"{API_URL}/oracle",
                        headers={"Authorization": f"Bearer {luna_token}"},
                        json={"message": "In one sentence, what is my sun sign?"})
    elapsed = time.time() - start_time
    
    test("A5.1: POST /api/oracle returns 201", resp.status_code == 201, f"Got {resp.status_code}")
    if resp.status_code == 201:
        data = resp.json()
        reply = data.get('reply', {})
        session_id = data.get('sessionId')
        
        test("A5.2: Response has 'reply' object", isinstance(reply, dict), f"Got {type(reply)}")
        test("A5.3: Reply has role='assistant'", reply.get('role') == 'assistant', f"Got role: {reply.get('role')}")
        test("A5.4: Reply has non-empty text", len(reply.get('text', '')) > 0, f"Text length: {len(reply.get('text', ''))}")
        test("A5.5: Response has sessionId", session_id is not None, "sessionId is None")
        
        # Verify GET returns 2 messages now (user + assistant)
        resp_get = requests.get(f"{API_URL}/oracle", headers={"Authorization": f"Bearer {luna_token}"})
        if resp_get.status_code == 200:
            messages = resp_get.json().get('messages', [])
            test("A5.6: GET /api/oracle now returns 2 messages", len(messages) == 2, f"Got {len(messages)} messages")
        else:
            test("A5.6: GET /api/oracle now returns 2 messages", False, f"GET failed with {resp_get.status_code}")
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 6

# Test A6: DELETE /api/oracle
print("\nTest A6: DELETE /api/oracle")
# First test DELETE without token
resp = requests.delete(f"{API_URL}/oracle")
test("A6.1: DELETE /api/oracle without token returns 401", resp.status_code == 401, f"Got {resp.status_code}")

# DELETE as luna
if luna_token:
    resp = requests.delete(f"{API_URL}/oracle", headers={"Authorization": f"Bearer {luna_token}"})
    test("A6.2: DELETE /api/oracle returns 200 with ok:true", 
         resp.status_code == 200 and resp.json().get('ok') == True, 
         f"Got {resp.status_code}, body: {resp.json()}")
    
    # Verify GET returns empty messages
    resp_get = requests.get(f"{API_URL}/oracle", headers={"Authorization": f"Bearer {luna_token}"})
    if resp_get.status_code == 200:
        messages = resp_get.json().get('messages', [])
        test("A6.3: GET /api/oracle after DELETE returns empty messages", len(messages) == 0, f"Got {len(messages)} messages")
    else:
        test("A6.3: GET /api/oracle after DELETE returns empty messages", False, f"GET failed with {resp_get.status_code}")
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 2

# ============================================================================
# B) BOND STORY TESTS
# ============================================================================
print("\n--- B) BOND STORY TESTS ---\n")

# Test B7: GET /api/bond-story validation
print("Test B7: GET /api/bond-story validation")
resp = requests.get(f"{API_URL}/bond-story")
test("B7.1: GET /api/bond-story without token returns 401", resp.status_code == 401, f"Got {resp.status_code}")

if luna_token:
    resp = requests.get(f"{API_URL}/bond-story", headers={"Authorization": f"Bearer {luna_token}"})
    test("B7.2: GET /api/bond-story without partnerId returns 400", resp.status_code == 400, f"Got {resp.status_code}")
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 1

# Test B8: GET /api/bond-story for Orion Vale (cached story exists)
print("\nTest B8: GET /api/bond-story for Orion Vale (cached)")
if luna_token:
    # First get partners list
    resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {luna_token}"})
    test("B8.1: GET /api/partners returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    if resp.status_code == 200:
        partners = resp.json().get('partners', [])
        orion = next((p for p in partners if p.get('partnerName') == 'Orion Vale'), None)
        river = next((p for p in partners if p.get('partnerName') == 'River Sage'), None)
        
        test("B8.2: Found partner 'Orion Vale'", orion is not None, "Orion Vale not found in partners")
        test("B8.3: Found partner 'River Sage'", river is not None, "River Sage not found in partners")
        
        if orion:
            orion_id = orion.get('id')
            resp = requests.get(f"{API_URL}/bond-story?partnerId={orion_id}", 
                              headers={"Authorization": f"Bearer {luna_token}"})
            test("B8.4: GET /api/bond-story for Orion returns 200", resp.status_code == 200, f"Got {resp.status_code}")
            
            if resp.status_code == 200:
                data = resp.json()
                story = data.get('story')
                test("B8.5: Response has 'story' object", story is not None, "story is None")
                
                if story:
                    test("B8.6: Story has 'id' field (UUID)", 'id' in story, f"Keys: {story.keys()}")
                    test("B8.7: Story has 'partnerId' field", 'partnerId' in story, f"Keys: {story.keys()}")
                    test("B8.8: Story has 'partnerName' field", 'partnerName' in story, f"Keys: {story.keys()}")
                    test("B8.9: Story has 'text' field", 'text' in story, f"Keys: {story.keys()}")
                    test("B8.10: Story has 'model' field", 'model' in story, f"Keys: {story.keys()}")
                    test("B8.11: Story has 'createdAt' field", 'createdAt' in story, f"Keys: {story.keys()}")
                    test("B8.12: Story has no '_id' field", '_id' not in story, "Found MongoDB _id")
        else:
            tests_failed += 9
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 12

# Test B9: GET /api/bond-story for River Sage (no cached story)
print("\nTest B9: GET /api/bond-story for River Sage (no cache)")
if luna_token and river:
    river_id = river.get('id')
    resp = requests.get(f"{API_URL}/bond-story?partnerId={river_id}",
                       headers={"Authorization": f"Bearer {luna_token}"})
    test("B9.1: GET /api/bond-story for River Sage returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        story = data.get('story')
        test("B9.2: Story is null (no cache for River Sage)", story is None, f"Got story: {story}")
else:
    if not luna_token:
        print("❌ Failed to login as luna@zaura.app")
    if not river:
        print("❌ River Sage partner not found")
    tests_failed += 2

# Test B10: POST /api/bond-story validation
print("\nTest B10: POST /api/bond-story validation")
if luna_token:
    # POST without partnerId
    resp = requests.post(f"{API_URL}/bond-story",
                        headers={"Authorization": f"Bearer {luna_token}"},
                        json={})
    test("B10.1: POST /api/bond-story without partnerId returns 400", resp.status_code == 400, f"Got {resp.status_code}")
    
    # POST with nonexistent partnerId
    resp = requests.post(f"{API_URL}/bond-story",
                        headers={"Authorization": f"Bearer {luna_token}"},
                        json={"partnerId": "nonexistent-id-12345"})
    test("B10.2: POST /api/bond-story with nonexistent partnerId returns 404", resp.status_code == 404, f"Got {resp.status_code}")
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 2

# POST as throwaway user (no profile)
if throwaway_token:
    resp = requests.post(f"{API_URL}/bond-story",
                        headers={"Authorization": f"Bearer {throwaway_token}"},
                        json={"partnerId": "any-id"})
    test("B10.3: POST /api/bond-story without profile returns 404", resp.status_code == 404, f"Got {resp.status_code}")
else:
    print("❌ Throwaway token not available")
    tests_failed += 1

# Test B11: POST /api/bond-story for Orion (cached, no regenerate)
print("\nTest B11: POST /api/bond-story for Orion (cached, no LLM call)")
if luna_token and orion:
    orion_id = orion.get('id')
    start_time = time.time()
    resp = requests.post(f"{API_URL}/bond-story",
                        headers={"Authorization": f"Bearer {luna_token}"},
                        json={"partnerId": orion_id})
    elapsed = time.time() - start_time
    
    test("B11.1: POST /api/bond-story for Orion returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    if resp.status_code == 200:
        data = resp.json()
        cached = data.get('cached')
        test("B11.2: Response has cached=true", cached == True, f"Got cached: {cached}")
        test("B11.3: Response time < 2s (instant cache)", elapsed < 2.0, f"Took {elapsed:.3f}s")
        
        story = data.get('story')
        test("B11.4: Response has story object", story is not None, "story is None")
else:
    if not luna_token:
        print("❌ Failed to login as luna@zaura.app")
    if not orion:
        print("❌ Orion Vale partner not found")
    tests_failed += 4

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "="*80)
print(f"TESTS COMPLETE: {tests_passed} passed, {tests_failed} failed")
print("="*80 + "\n")

sys.exit(0 if tests_failed == 0 else 1)
