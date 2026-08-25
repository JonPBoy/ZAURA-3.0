#!/usr/bin/env python3
"""
Backend API test suite for Zaura app - Friend Invites API
Tests POST /api/invites, GET /api/invite/:code, POST /api/invite/:code/accept
"""

import requests
import time
import sys
import os
import uuid

# Get base URL from environment
BASE_URL = os.getenv('NEXT_PUBLIC_BASE_URL', 'https://soul-compass-58.preview.emergentagent.com')
API_URL = f"{BASE_URL}/api"

# Test credentials
LUNA_EMAIL = "luna@zaura.app"
LUNA_PASSWORD = "cosmic123"
SAGE_EMAIL = "sage@zaura.app"
SAGE_PASSWORD = "cosmic123"
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
    """Register a throwaway user and return token and email"""
    email = f"throwaway_{uuid.uuid4().hex[:8]}@test.com"
    resp = requests.post(f"{API_URL}/auth/register", json={
        "email": email,
        "password": "test123",
        "name": "Throwaway User"
    })
    if resp.status_code == 201:
        return resp.json().get('token'), email
    return None, None

def create_profile(token, full_name, birth_date, birth_time=None):
    """Create a birth profile for a user"""
    profile_data = {
        "fullName": full_name,
        "birthDate": birth_date,
        "birthTime": birth_time,
        "birthCity": "New York",
        "lat": 40.7128,
        "lng": -74.0060
    }
    resp = requests.post(f"{API_URL}/profile", 
                        headers={"Authorization": f"Bearer {token}"},
                        json=profile_data)
    return resp.status_code in [200, 201]

print("\n" + "="*80)
print("ZAURA BACKEND TEST - FRIEND INVITES API")
print("="*80 + "\n")

# Store throwaway user data for cleanup
throwaway_token = None
throwaway_email = None
throwaway_name = None
throwaway_partner_id = None

# ============================================================================
# Test 1: POST /api/invites as luna -> 200 {code: "f572fce1"} (idempotent)
# ============================================================================
print("\n--- Test 1: POST /api/invites as luna (idempotent) ---\n")

luna_token = login(LUNA_EMAIL, LUNA_PASSWORD)
if luna_token:
    test("1.1: Login as luna@zaura.app successful", True)
    
    # First call
    resp = requests.post(f"{API_URL}/invites", headers={"Authorization": f"Bearer {luna_token}"})
    test("1.2: POST /api/invites returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        code = data.get('code')
        test("1.3: Response has 'code' field", code is not None, f"Response: {data}")
        test("1.4: Code is 'f572fce1' (persistent)", code == 'f572fce1', f"Got code: {code}")
        
        # Second call - should return same code (idempotent)
        resp2 = requests.post(f"{API_URL}/invites", headers={"Authorization": f"Bearer {luna_token}"})
        test("1.5: Second POST /api/invites returns 200", resp2.status_code == 200, f"Got {resp2.status_code}")
        
        if resp2.status_code == 200:
            data2 = resp2.json()
            code2 = data2.get('code')
            test("1.6: Second call returns same code (idempotent)", code2 == code, f"Got code: {code2}, expected: {code}")
else:
    print("❌ Failed to login as luna@zaura.app")
    tests_failed += 6

# ============================================================================
# Test 2: POST /api/invites without token -> 401
# ============================================================================
print("\n--- Test 2: POST /api/invites without token -> 401 ---\n")

resp = requests.post(f"{API_URL}/invites")
test("2.1: POST /api/invites without token returns 401", resp.status_code == 401, f"Got {resp.status_code}")

# ============================================================================
# Test 3: POST /api/invites as new user without birth profile -> 404
# ============================================================================
print("\n--- Test 3: POST /api/invites without birth profile -> 404 ---\n")

temp_token, temp_email = register_throwaway()
if temp_token:
    test("3.1: Register temporary user successful", True)
    
    resp = requests.post(f"{API_URL}/invites", headers={"Authorization": f"Bearer {temp_token}"})
    test("3.2: POST /api/invites without profile returns 404", resp.status_code == 404, f"Got {resp.status_code}")
    
    if resp.status_code == 404:
        error_msg = resp.json().get('error', '')
        test("3.3: Error message mentions birth profile", 'birth profile' in error_msg.lower() or 'profile' in error_msg.lower(), f"Got: {error_msg}")
else:
    print("❌ Failed to register temporary user")
    tests_failed += 3

# ============================================================================
# Test 4: GET /api/invite/f572fce1 (no auth) -> 200 {inviterFirstName, sunSign, sunGlyph}
# ============================================================================
print("\n--- Test 4: GET /api/invite/f572fce1 (public, no auth) ---\n")

resp = requests.get(f"{API_URL}/invite/f572fce1")
test("4.1: GET /api/invite/f572fce1 returns 200", resp.status_code == 200, f"Got {resp.status_code}")

if resp.status_code == 200:
    data = resp.json()
    test("4.2: Response has 'inviterFirstName' field", 'inviterFirstName' in data, f"Keys: {data.keys()}")
    test("4.3: Response has 'sunSign' field", 'sunSign' in data, f"Keys: {data.keys()}")
    test("4.4: Response has 'sunGlyph' field", 'sunGlyph' in data, f"Keys: {data.keys()}")
    
    inviter_name = data.get('inviterFirstName')
    test("4.5: inviterFirstName is 'Luna'", inviter_name == 'Luna', f"Got: {inviter_name}")
    
    sun_sign = data.get('sunSign')
    test("4.6: sunSign is 'Cancer'", sun_sign == 'Cancer', f"Got: {sun_sign}")
    
    sun_glyph = data.get('sunGlyph')
    test("4.7: sunGlyph is present", sun_glyph is not None and len(str(sun_glyph)) > 0, f"Got: {sun_glyph}")
else:
    tests_failed += 6

# ============================================================================
# Test 5: GET /api/invite/doesnotexist -> 404
# ============================================================================
print("\n--- Test 5: GET /api/invite/doesnotexist -> 404 ---\n")

resp = requests.get(f"{API_URL}/invite/doesnotexist")
test("5.1: GET /api/invite/doesnotexist returns 404", resp.status_code == 404, f"Got {resp.status_code}")

# ============================================================================
# Test 6: POST /api/invite/f572fce1/accept as luna herself -> 400
# ============================================================================
print("\n--- Test 6: POST /api/invite/f572fce1/accept as luna (own invite) -> 400 ---\n")

if luna_token:
    resp = requests.post(f"{API_URL}/invite/f572fce1/accept", headers={"Authorization": f"Bearer {luna_token}"})
    test("6.1: POST /api/invite/f572fce1/accept as luna returns 400", resp.status_code == 400, f"Got {resp.status_code}")
    
    if resp.status_code == 400:
        error_msg = resp.json().get('error', '')
        test("6.2: Error message mentions own invite", 'own' in error_msg.lower(), f"Got: {error_msg}")
else:
    print("❌ Luna token not available")
    tests_failed += 2

# ============================================================================
# Test 7: POST /api/invite/f572fce1/accept without token -> 401
# ============================================================================
print("\n--- Test 7: POST /api/invite/f572fce1/accept without token -> 401 ---\n")

resp = requests.post(f"{API_URL}/invite/f572fce1/accept")
test("7.1: POST /api/invite/f572fce1/accept without token returns 401", resp.status_code == 401, f"Got {resp.status_code}")

# ============================================================================
# Test 8: POST /api/invite/f572fce1/accept as throwaway without profile -> 404
# ============================================================================
print("\n--- Test 8: POST /api/invite/f572fce1/accept without profile -> 404 ---\n")

if temp_token:
    resp = requests.post(f"{API_URL}/invite/f572fce1/accept", headers={"Authorization": f"Bearer {temp_token}"})
    test("8.1: POST /api/invite/f572fce1/accept without profile returns 404", resp.status_code == 404, f"Got {resp.status_code}")
    
    if resp.status_code == 404:
        error_msg = resp.json().get('error', '')
        test("8.2: Error message mentions birth profile", 'birth profile' in error_msg.lower() or 'profile' in error_msg.lower(), f"Got: {error_msg}")
else:
    print("❌ Temp token not available")
    tests_failed += 2

# ============================================================================
# Test 9: Full accept flow with new throwaway user
# ============================================================================
print("\n--- Test 9: Full accept flow with new throwaway user ---\n")

# Register new throwaway user
throwaway_token, throwaway_email = register_throwaway()
if throwaway_token:
    test("9.1: Register throwaway user successful", True)
    
    # Create birth profile
    throwaway_name = f"Cosmic Traveler {uuid.uuid4().hex[:4]}"
    profile_created = create_profile(throwaway_token, throwaway_name, "1995-08-15", "14:30")
    test("9.2: Create birth profile successful", profile_created, "Failed to create profile")
    
    if profile_created:
        # Accept luna's invite
        resp = requests.post(f"{API_URL}/invite/f572fce1/accept", 
                           headers={"Authorization": f"Bearer {throwaway_token}"})
        test("9.3: POST /api/invite/f572fce1/accept returns 200", resp.status_code == 200, f"Got {resp.status_code}")
        
        if resp.status_code == 200:
            data = resp.json()
            test("9.4: Response has 'partnerId' field (UUID)", 'partnerId' in data, f"Keys: {data.keys()}")
            test("9.5: Response has 'inviterName' field", 'inviterName' in data, f"Keys: {data.keys()}")
            
            partner_id = data.get('partnerId')
            inviter_name = data.get('inviterName')
            
            test("9.6: partnerId is a UUID", partner_id is not None and len(partner_id) > 20, f"Got: {partner_id}")
            test("9.7: inviterName is 'Luna Rose Winters'", inviter_name == 'Luna Rose Winters', f"Got: {inviter_name}")
            
            throwaway_partner_id = partner_id
else:
    print("❌ Failed to register throwaway user")
    tests_failed += 7

# ============================================================================
# Test 10: Verify mutual partner creation
# ============================================================================
print("\n--- Test 10: Verify mutual partner creation ---\n")

# Check throwaway's partners list
if throwaway_token:
    resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {throwaway_token}"})
    test("10.1: GET /api/partners as throwaway returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        partners = data.get('partners', [])
        test("10.2: Throwaway has at least 1 partner", len(partners) >= 1, f"Got {len(partners)} partners")
        
        if len(partners) > 0:
            luna_partner = next((p for p in partners if 'Luna' in p.get('partnerName', '')), None)
            test("10.3: Throwaway's partners contains Luna Rose Winters", luna_partner is not None, f"Partners: {[p.get('partnerName') for p in partners]}")
            
            if luna_partner:
                test("10.4: Luna partner has 'viaInvite' = true", luna_partner.get('viaInvite') == True, f"Got viaInvite: {luna_partner.get('viaInvite')}")
                test("10.5: Luna partner has 'overall' score (0-100)", 
                     isinstance(luna_partner.get('overall'), (int, float)) and 0 <= luna_partner.get('overall') <= 100,
                     f"Got overall: {luna_partner.get('overall')}")
else:
    print("❌ Throwaway token not available")
    tests_failed += 5

# Check luna's partners list
if luna_token:
    resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {luna_token}"})
    test("10.6: GET /api/partners as luna returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    if resp.status_code == 200:
        data = resp.json()
        partners = data.get('partners', [])
        
        # Luna should now have 4 partners: Sage Moon, Orion Vale, River Sage, and the throwaway
        test("10.7: Luna has at least 4 partners", len(partners) >= 4, f"Got {len(partners)} partners")
        
        # Find the throwaway partner
        throwaway_partner = next((p for p in partners if throwaway_name in p.get('partnerName', '')), None)
        test("10.8: Luna's partners contains throwaway user", throwaway_partner is not None, f"Partners: {[p.get('partnerName') for p in partners]}")
        
        if throwaway_partner:
            test("10.9: Throwaway partner has 'viaInvite' = true", throwaway_partner.get('viaInvite') == True, f"Got viaInvite: {throwaway_partner.get('viaInvite')}")
            test("10.10: Throwaway partner has 'overall' score (0-100)",
                 isinstance(throwaway_partner.get('overall'), (int, float)) and 0 <= throwaway_partner.get('overall') <= 100,
                 f"Got overall: {throwaway_partner.get('overall')}")
            
            # Store the partner ID for cleanup
            throwaway_partner_id = throwaway_partner.get('id')
else:
    print("❌ Luna token not available")
    tests_failed += 5

# ============================================================================
# Test 11: Repeat accept (idempotency - no duplicate partners)
# ============================================================================
print("\n--- Test 11: Repeat accept (idempotency check) ---\n")

if throwaway_token:
    # Get current partner count for throwaway
    resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {throwaway_token}"})
    if resp.status_code == 200:
        partners_before = resp.json().get('partners', [])
        count_before = len(partners_before)
        
        # Accept invite again
        resp = requests.post(f"{API_URL}/invite/f572fce1/accept", 
                           headers={"Authorization": f"Bearer {throwaway_token}"})
        test("11.1: Second POST /api/invite/f572fce1/accept returns 200", resp.status_code == 200, f"Got {resp.status_code}")
        
        # Check partner count hasn't increased
        resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {throwaway_token}"})
        if resp.status_code == 200:
            partners_after = resp.json().get('partners', [])
            count_after = len(partners_after)
            test("11.2: Partner count unchanged (no duplicate)", count_after == count_before, f"Before: {count_before}, After: {count_after}")
else:
    print("❌ Throwaway token not available")
    tests_failed += 2

# Check luna's partner count also unchanged
if luna_token:
    resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {luna_token}"})
    if resp.status_code == 200:
        partners = resp.json().get('partners', [])
        # Count how many times throwaway appears
        throwaway_count = sum(1 for p in partners if throwaway_name in p.get('partnerName', ''))
        test("11.3: Luna has exactly 1 entry for throwaway (no duplicate)", throwaway_count == 1, f"Found {throwaway_count} entries")
else:
    print("❌ Luna token not available")
    tests_failed += 1

# ============================================================================
# Test 12: Cleanup - delete throwaway from luna's partners only
# ============================================================================
print("\n--- Test 12: Cleanup - delete throwaway from luna's partners ---\n")

if luna_token and throwaway_partner_id:
    # Delete the throwaway partner from luna's list
    resp = requests.delete(f"{API_URL}/partners/{throwaway_partner_id}", 
                          headers={"Authorization": f"Bearer {luna_token}"})
    test("12.1: DELETE /api/partners/:id returns 200", resp.status_code == 200, f"Got {resp.status_code}")
    
    # Verify luna's partners list is back to 3 (Sage Moon, Orion Vale, River Sage)
    resp = requests.get(f"{API_URL}/partners", headers={"Authorization": f"Bearer {luna_token}"})
    if resp.status_code == 200:
        partners = resp.json().get('partners', [])
        test("12.2: Luna has 3 partners after cleanup", len(partners) == 3, f"Got {len(partners)} partners")
        
        # Verify the 3 partners are the original ones
        partner_names = [p.get('partnerName') for p in partners]
        has_sage = 'Sage Moon' in partner_names
        has_orion = 'Orion Vale' in partner_names
        has_river = 'River Sage' in partner_names
        
        test("12.3: Luna has 'Sage Moon' partner", has_sage, f"Partners: {partner_names}")
        test("12.4: Luna has 'Orion Vale' partner", has_orion, f"Partners: {partner_names}")
        test("12.5: Luna has 'River Sage' partner", has_river, f"Partners: {partner_names}")
        
        # Verify throwaway is NOT in the list
        has_throwaway = any(throwaway_name in name for name in partner_names)
        test("12.6: Luna does NOT have throwaway partner", not has_throwaway, f"Partners: {partner_names}")
else:
    print("❌ Luna token or throwaway_partner_id not available")
    tests_failed += 6

# ============================================================================
# Test 13: POST /api/invite/nonexistent/accept -> 404
# ============================================================================
print("\n--- Test 13: POST /api/invite/nonexistent/accept -> 404 ---\n")

if throwaway_token:
    resp = requests.post(f"{API_URL}/invite/nonexistent12345/accept", 
                        headers={"Authorization": f"Bearer {throwaway_token}"})
    test("13.1: POST /api/invite/nonexistent/accept returns 404", resp.status_code == 404, f"Got {resp.status_code}")
    
    if resp.status_code == 404:
        error_msg = resp.json().get('error', '')
        test("13.2: Error message mentions invite not found", 'invite' in error_msg.lower() and 'not found' in error_msg.lower(), f"Got: {error_msg}")
else:
    print("❌ Throwaway token not available")
    tests_failed += 2

# ============================================================================
# SUMMARY
# ============================================================================
print("\n" + "="*80)
print(f"FRIEND INVITES API TESTS COMPLETE: {tests_passed} passed, {tests_failed} failed")
print("="*80 + "\n")

if tests_failed == 0:
    print("✅ ALL TESTS PASSED - Friend Invites API is working correctly!")
else:
    print(f"❌ {tests_failed} TESTS FAILED - Please review the errors above")

sys.exit(0 if tests_failed == 0 else 1)
