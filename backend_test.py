#!/usr/bin/env python3
"""
Zaura Backend API Test Suite
Tests all auth and profile endpoints with comprehensive validation
"""
import requests
import json
import uuid
import re
from datetime import datetime

# Base URL from environment
BASE_URL = "https://soul-compass-58.preview.emergentagent.com/api"

# Test user credentials (existing user with profile - DO NOT DELETE)
EXISTING_USER = {
    "email": "luna@zaura.app",
    "password": "cosmic123"
}

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
YELLOW = '\033[93m'
BLUE = '\033[94m'
RESET = '\033[0m'

def log_test(name, passed, details=""):
    """Log test result with color"""
    status = f"{GREEN}✅ PASS{RESET}" if passed else f"{RED}❌ FAIL{RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")
    return passed

def is_uuid(value):
    """Check if value is a valid UUID"""
    try:
        uuid.UUID(str(value))
        return True
    except:
        return False

def check_no_objectid(data, path=""):
    """Recursively check for MongoDB ObjectID leakage"""
    issues = []
    if isinstance(data, dict):
        if '_id' in data:
            issues.append(f"Found '_id' field at {path}")
        for key, value in data.items():
            new_path = f"{path}.{key}" if path else key
            issues.extend(check_no_objectid(value, new_path))
    elif isinstance(data, list):
        for i, item in enumerate(data):
            issues.extend(check_no_objectid(item, f"{path}[{i}]"))
    return issues

print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}Zaura Backend API Test Suite{RESET}")
print(f"{BLUE}{'='*60}{RESET}\n")

# Track results
results = {
    "passed": 0,
    "failed": 0,
    "tests": []
}

def record_result(name, passed, details=""):
    """Record test result"""
    results["tests"].append({"name": name, "passed": passed, "details": details})
    if passed:
        results["passed"] += 1
    else:
        results["failed"] += 1
    return log_test(name, passed, details)

# ============================================================================
# TEST 1: POST /api/auth/register - Success Case
# ============================================================================
print(f"\n{YELLOW}TEST 1: POST /api/auth/register - Success (201){RESET}")
try:
    unique_email = f"test_{uuid.uuid4().hex[:8]}@zaura.test"
    payload = {
        "email": unique_email,
        "password": "testpass123",
        "name": "Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    passed = response.status_code == 201
    if passed:
        data = response.json()
        # Check structure
        has_token = "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        has_user = "user" in data and isinstance(data["user"], dict)
        
        if has_user:
            user = data["user"]
            has_id = "id" in user and is_uuid(user["id"])
            has_email = "email" in user and user["email"] == unique_email
            has_name = "name" in user and user["name"] == "Test User"
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_token and has_id and has_email and has_name and len(objectid_issues) == 0
            details = f"Token: {has_token}, UUID: {has_id}, Email: {has_email}, Name: {has_name}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'user' object in response"
    else:
        details = f"Expected 201, got {response.status_code}: {response.text}"
    
    record_result("Register new user (201)", passed, details)
    
    # Save token for later tests
    if passed:
        NEW_USER_TOKEN = data["token"]
        NEW_USER_EMAIL = unique_email
except Exception as e:
    record_result("Register new user (201)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 2: POST /api/auth/register - Duplicate Email (409)
# ============================================================================
print(f"\n{YELLOW}TEST 2: POST /api/auth/register - Duplicate Email (409){RESET}")
try:
    payload = {
        "email": unique_email,  # Same email as above
        "password": "anotherpass",
        "name": "Another User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    passed = response.status_code == 409
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("Register duplicate email (409)", passed, details)
except Exception as e:
    record_result("Register duplicate email (409)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 3: POST /api/auth/register - Invalid Email Format (400)
# ============================================================================
print(f"\n{YELLOW}TEST 3: POST /api/auth/register - Invalid Email (400){RESET}")
try:
    payload = {
        "email": "not-an-email",
        "password": "testpass123",
        "name": "Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("Register invalid email (400)", passed, details)
except Exception as e:
    record_result("Register invalid email (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 4: POST /api/auth/register - Weak Password (400)
# ============================================================================
print(f"\n{YELLOW}TEST 4: POST /api/auth/register - Weak Password (400){RESET}")
try:
    payload = {
        "email": f"test_{uuid.uuid4().hex[:8]}@zaura.test",
        "password": "12345",  # Only 5 characters
        "name": "Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("Register weak password (400)", passed, details)
except Exception as e:
    record_result("Register weak password (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 5: POST /api/auth/login - Correct Credentials (200)
# ============================================================================
print(f"\n{YELLOW}TEST 5: POST /api/auth/login - Correct Credentials (200){RESET}")
try:
    payload = {
        "email": EXISTING_USER["email"],
        "password": EXISTING_USER["password"]
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_token = "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        has_user = "user" in data and isinstance(data["user"], dict)
        
        if has_user:
            user = data["user"]
            has_id = "id" in user and is_uuid(user["id"])
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_token and has_id and len(objectid_issues) == 0
            details = f"Token: {has_token}, UUID: {has_id}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'user' object in response"
        
        # Save token for later tests
        if passed:
            EXISTING_USER_TOKEN = data["token"]
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("Login correct credentials (200)", passed, details)
except Exception as e:
    record_result("Login correct credentials (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 6: POST /api/auth/login - Wrong Password (401)
# ============================================================================
print(f"\n{YELLOW}TEST 6: POST /api/auth/login - Wrong Password (401){RESET}")
try:
    payload = {
        "email": EXISTING_USER["email"],
        "password": "wrongpassword"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("Login wrong password (401)", passed, details)
except Exception as e:
    record_result("Login wrong password (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 7: POST /api/auth/login - Unknown Email (401)
# ============================================================================
print(f"\n{YELLOW}TEST 7: POST /api/auth/login - Unknown Email (401){RESET}")
try:
    payload = {
        "email": f"nonexistent_{uuid.uuid4().hex[:8]}@zaura.test",
        "password": "somepassword"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("Login unknown email (401)", passed, details)
except Exception as e:
    record_result("Login unknown email (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 8: GET /api/auth/me - With Valid Token (200)
# ============================================================================
print(f"\n{YELLOW}TEST 8: GET /api/auth/me - With Valid Token (200){RESET}")
try:
    headers = {"Authorization": f"Bearer {EXISTING_USER_TOKEN}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_user = "user" in data and isinstance(data["user"], dict)
        has_profile = "profile" in data  # Can be null or object
        
        if has_user:
            user = data["user"]
            has_id = "id" in user and is_uuid(user["id"])
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_id and len(objectid_issues) == 0
            details = f"User UUID: {has_id}, Has profile field: {has_profile}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'user' object in response"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/auth/me with token (200)", passed, details)
except Exception as e:
    record_result("GET /api/auth/me with token (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 9: GET /api/auth/me - Without Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 9: GET /api/auth/me - Without Token (401){RESET}")
try:
    response = requests.get(f"{BASE_URL}/auth/me")
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("GET /api/auth/me without token (401)", passed, details)
except Exception as e:
    record_result("GET /api/auth/me without token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 10: GET /api/auth/me - With Garbage Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 10: GET /api/auth/me - With Garbage Token (401){RESET}")
try:
    headers = {"Authorization": "Bearer garbage_token_12345"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("GET /api/auth/me with garbage token (401)", passed, details)
except Exception as e:
    record_result("GET /api/auth/me with garbage token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 11: POST /api/profile - Valid Data First Time (201)
# ============================================================================
print(f"\n{YELLOW}TEST 11: POST /api/profile - Valid Data First Time (201){RESET}")
try:
    # Use the newly created user token
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    payload = {
        "fullName": "Test Soul",
        "birthDate": "1990-03-25",
        "birthTime": "14:30",
        "birthCity": "Paris, France",
        "lat": 48.86,
        "lng": 2.35
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload, headers=headers)
    
    passed = response.status_code == 201
    if passed:
        data = response.json()
        has_profile = "profile" in data and isinstance(data["profile"], dict)
        
        if has_profile:
            profile = data["profile"]
            has_id = "id" in profile and is_uuid(profile["id"])
            has_user_id = "userId" in profile and is_uuid(profile["userId"])
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_id and has_user_id and len(objectid_issues) == 0
            details = f"Profile UUID: {has_id}, UserID UUID: {has_user_id}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
            
            # Save profile ID for later
            if passed:
                NEW_USER_PROFILE_ID = profile["id"]
        else:
            passed = False
            details = "Missing 'profile' object in response"
    else:
        details = f"Expected 201, got {response.status_code}: {response.text}"
    
    record_result("POST /api/profile first time (201)", passed, details)
except Exception as e:
    record_result("POST /api/profile first time (201)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 12: POST /api/profile - Valid Data Second Time (200 - Upsert)
# ============================================================================
print(f"\n{YELLOW}TEST 12: POST /api/profile - Valid Data Second Time (200 - Upsert){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    payload = {
        "fullName": "Test Soul Updated",
        "birthDate": "1990-03-25",
        "birthTime": "15:00",
        "birthCity": "London, UK",
        "lat": 51.51,
        "lng": -0.13
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload, headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_profile = "profile" in data and isinstance(data["profile"], dict)
        
        if has_profile:
            profile = data["profile"]
            # Check that profile ID is the same (upsert, not new)
            same_id = profile.get("id") == NEW_USER_PROFILE_ID
            updated_name = profile.get("fullName") == "Test Soul Updated"
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = same_id and updated_name and len(objectid_issues) == 0
            details = f"Same ID: {same_id}, Updated: {updated_name}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'profile' object in response"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("POST /api/profile second time (200 upsert)", passed, details)
except Exception as e:
    record_result("POST /api/profile second time (200 upsert)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 13: POST /api/profile - Missing fullName (400)
# ============================================================================
print(f"\n{YELLOW}TEST 13: POST /api/profile - Missing fullName (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    payload = {
        "birthDate": "1990-03-25",
        "birthTime": "14:30"
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/profile missing fullName (400)", passed, details)
except Exception as e:
    record_result("POST /api/profile missing fullName (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 14: POST /api/profile - Bad Date Format (400)
# ============================================================================
print(f"\n{YELLOW}TEST 14: POST /api/profile - Bad Date Format (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    payload = {
        "fullName": "Test Soul",
        "birthDate": "25-03-1990",  # Wrong format
        "birthTime": "14:30"
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/profile bad date format (400)", passed, details)
except Exception as e:
    record_result("POST /api/profile bad date format (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 15: POST /api/profile - Out of Range Date (400)
# ============================================================================
print(f"\n{YELLOW}TEST 15: POST /api/profile - Out of Range Date (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    payload = {
        "fullName": "Test Soul",
        "birthDate": "1850-01-01",  # Before 1900
        "birthTime": "14:30"
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/profile out of range date (400)", passed, details)
except Exception as e:
    record_result("POST /api/profile out of range date (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 16: POST /api/profile - Bad Time Format (400)
# ============================================================================
print(f"\n{YELLOW}TEST 16: POST /api/profile - Bad Time Format (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    payload = {
        "fullName": "Test Soul",
        "birthDate": "1990-03-25",
        "birthTime": "2pm"  # Wrong format
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/profile bad time format (400)", passed, details)
except Exception as e:
    record_result("POST /api/profile bad time format (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 17: POST /api/profile - No Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 17: POST /api/profile - No Token (401){RESET}")
try:
    payload = {
        "fullName": "Test Soul",
        "birthDate": "1990-03-25",
        "birthTime": "14:30"
    }
    response = requests.post(f"{BASE_URL}/profile", json=payload)
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/profile no token (401)", passed, details)
except Exception as e:
    record_result("POST /api/profile no token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 18: GET /api/profile - With Token (Returns Saved Profile)
# ============================================================================
print(f"\n{YELLOW}TEST 18: GET /api/profile - With Token (Returns Profile){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    response = requests.get(f"{BASE_URL}/profile", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_profile = "profile" in data and isinstance(data["profile"], dict)
        
        if has_profile:
            profile = data["profile"]
            has_id = "id" in profile and is_uuid(profile["id"])
            has_full_name = "fullName" in profile
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_id and has_full_name and len(objectid_issues) == 0
            details = f"Profile UUID: {has_id}, Has fullName: {has_full_name}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'profile' object in response"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/profile with token", passed, details)
except Exception as e:
    record_result("GET /api/profile with token", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 19: DELETE /api/profile - With Token (Success)
# ============================================================================
print(f"\n{YELLOW}TEST 19: DELETE /api/profile - With Token (Success){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    response = requests.delete(f"{BASE_URL}/profile", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_ok = "ok" in data and data["ok"] is True
        
        passed = has_ok
        details = f"Response ok: {has_ok}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("DELETE /api/profile with token", passed, details)
except Exception as e:
    record_result("DELETE /api/profile with token", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 20: GET /api/profile - After Delete (Returns null)
# ============================================================================
print(f"\n{YELLOW}TEST 20: GET /api/profile - After Delete (Returns null){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    response = requests.get(f"{BASE_URL}/profile", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        profile_is_null = "profile" in data and data["profile"] is None
        
        passed = profile_is_null
        details = f"Profile is null: {profile_is_null}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/profile after delete (null)", passed, details)
except Exception as e:
    record_result("GET /api/profile after delete (null)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 21: POST /api/auth/logout - With Token (Success)
# ============================================================================
print(f"\n{YELLOW}TEST 21: POST /api/auth/logout - With Token (Success){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    response = requests.post(f"{BASE_URL}/auth/logout", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_ok = "ok" in data and data["ok"] is True
        
        passed = has_ok
        details = f"Response ok: {has_ok}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("POST /api/auth/logout with token", passed, details)
except Exception as e:
    record_result("POST /api/auth/logout with token", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 22: GET /api/auth/me - After Logout (401)
# ============================================================================
print(f"\n{YELLOW}TEST 22: GET /api/auth/me - After Logout (401){RESET}")
try:
    headers = {"Authorization": f"Bearer {NEW_USER_TOKEN}"}
    response = requests.get(f"{BASE_URL}/auth/me", headers=headers)
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("GET /api/auth/me after logout (401)", passed, details)
except Exception as e:
    record_result("GET /api/auth/me after logout (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 23: Login as luna@zaura.app (existing user with cached narrative)
# ============================================================================
print(f"\n{YELLOW}TEST 23: Login as luna@zaura.app (existing user){RESET}")
try:
    payload = {
        "email": "luna@zaura.app",
        "password": "cosmic123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_token = "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        
        passed = has_token
        details = f"Token received: {has_token}"
        
        # Save token for synthesis tests
        if passed:
            LUNA_TOKEN = data["token"]
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("Login luna@zaura.app (200)", passed, details)
except Exception as e:
    record_result("Login luna@zaura.app (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 24: GET /api/synthesis - Without Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 24: GET /api/synthesis - Without Token (401){RESET}")
try:
    response = requests.get(f"{BASE_URL}/synthesis")
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("GET /api/synthesis without token (401)", passed, details)
except Exception as e:
    record_result("GET /api/synthesis without token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 25: POST /api/synthesis - Without Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 25: POST /api/synthesis - Without Token (401){RESET}")
try:
    response = requests.post(f"{BASE_URL}/synthesis", json={})
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/synthesis without token (401)", passed, details)
except Exception as e:
    record_result("POST /api/synthesis without token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 26: GET /api/synthesis - With Token (Returns Cached Narrative)
# ============================================================================
print(f"\n{YELLOW}TEST 26: GET /api/synthesis - With Token (Returns Cached Narrative){RESET}")
try:
    headers = {"Authorization": f"Bearer {LUNA_TOKEN}"}
    response = requests.get(f"{BASE_URL}/synthesis", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_narrative = "narrative" in data and isinstance(data["narrative"], dict)
        
        if has_narrative:
            narrative = data["narrative"]
            has_id = "id" in narrative and is_uuid(narrative["id"])
            has_user_id = "userId" in narrative and is_uuid(narrative["userId"])
            has_profile_key = "profileKey" in narrative and isinstance(narrative["profileKey"], str)
            has_text = "text" in narrative and isinstance(narrative["text"], str) and len(narrative["text"]) > 200
            has_model = "model" in narrative and isinstance(narrative["model"], str)
            has_created_at = "createdAt" in narrative and isinstance(narrative["createdAt"], str)
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_id and has_user_id and has_profile_key and has_text and has_model and has_created_at and len(objectid_issues) == 0
            details = f"ID UUID: {has_id}, UserID UUID: {has_user_id}, ProfileKey: {has_profile_key}, Text length: {len(narrative.get('text', ''))}, Model: {has_model}, CreatedAt: {has_created_at}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
            
            # Save narrative text for comparison
            if passed:
                LUNA_NARRATIVE_TEXT = narrative["text"]
        else:
            passed = False
            details = "Missing 'narrative' object in response or narrative is null"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/synthesis with token (200)", passed, details)
except Exception as e:
    record_result("GET /api/synthesis with token (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 27: POST /api/synthesis - With Token, No Regenerate (Returns Cached)
# ============================================================================
print(f"\n{YELLOW}TEST 27: POST /api/synthesis - With Token, No Regenerate (Returns Cached){RESET}")
try:
    headers = {"Authorization": f"Bearer {LUNA_TOKEN}"}
    import time
    start_time = time.time()
    response = requests.post(f"{BASE_URL}/synthesis", json={}, headers=headers)
    elapsed_time = time.time() - start_time
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_narrative = "narrative" in data and isinstance(data["narrative"], dict)
        is_cached = "cached" in data and data["cached"] is True
        is_fast = elapsed_time < 2.0
        
        if has_narrative:
            narrative = data["narrative"]
            same_text = narrative.get("text") == LUNA_NARRATIVE_TEXT
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = is_cached and is_fast and same_text and len(objectid_issues) == 0
            details = f"Cached: {is_cached}, Fast (<2s): {is_fast} ({elapsed_time:.3f}s), Same text: {same_text}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'narrative' object in response"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("POST /api/synthesis cached (200)", passed, details)
except Exception as e:
    record_result("POST /api/synthesis cached (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 28: Register New User Without Profile, POST /api/synthesis (404)
# ============================================================================
print(f"\n{YELLOW}TEST 28: Register New User Without Profile, POST /api/synthesis (404){RESET}")
try:
    # Register a new throwaway user
    unique_email = f"throwaway_{uuid.uuid4().hex[:8]}@zaura.test"
    payload = {
        "email": unique_email,
        "password": "testpass123",
        "name": "Throwaway User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    if response.status_code == 201:
        data = response.json()
        throwaway_token = data["token"]
        
        # Try to POST /api/synthesis without saving a profile
        headers = {"Authorization": f"Bearer {throwaway_token}"}
        response = requests.post(f"{BASE_URL}/synthesis", json={}, headers=headers)
        
        passed = response.status_code == 404
        if passed:
            data = response.json()
            has_error = "error" in data
            correct_message = "error" in data and "profile" in data["error"].lower()
            
            passed = has_error and correct_message
            details = f"Status: 404, Error message contains 'profile': {correct_message}"
        else:
            details = f"Expected 404, got {response.status_code}: {response.text}"
        
        record_result("POST /api/synthesis without profile (404)", passed, details)
    else:
        record_result("POST /api/synthesis without profile (404)", False, f"Failed to register throwaway user: {response.status_code}")
except Exception as e:
    record_result("POST /api/synthesis without profile (404)", False, f"Exception: {str(e)}")

# ============================================================================
# SAVED PARTNERS API TESTS
# ============================================================================
print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}SAVED PARTNERS API TESTS{RESET}")
print(f"{BLUE}{'='*60}{RESET}\n")

# ============================================================================
# TEST 29: Register Throwaway User for Partners Testing
# ============================================================================
print(f"\n{YELLOW}TEST 29: Register Throwaway User for Partners Testing{RESET}")
try:
    throwaway_email = f"partner_test_{uuid.uuid4().hex[:8]}@zaura.test"
    payload = {
        "email": throwaway_email,
        "password": "testpass123",
        "name": "Partner Test User"
    }
    response = requests.post(f"{BASE_URL}/auth/register", json=payload)
    
    passed = response.status_code == 201
    if passed:
        data = response.json()
        has_token = "token" in data and isinstance(data["token"], str) and len(data["token"]) > 0
        
        passed = has_token
        details = f"Token received: {has_token}"
        
        # Save token for partners tests
        if passed:
            THROWAWAY_TOKEN = data["token"]
            THROWAWAY_EMAIL = throwaway_email
    else:
        details = f"Expected 201, got {response.status_code}: {response.text}"
    
    record_result("Register throwaway user for partners (201)", passed, details)
except Exception as e:
    record_result("Register throwaway user for partners (201)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 30: GET /api/partners - Without Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 30: GET /api/partners - Without Token (401){RESET}")
try:
    response = requests.get(f"{BASE_URL}/partners")
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("GET /api/partners without token (401)", passed, details)
except Exception as e:
    record_result("GET /api/partners without token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 31: GET /api/partners - With Token, Empty List (200)
# ============================================================================
print(f"\n{YELLOW}TEST 31: GET /api/partners - With Token, Empty List (200){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    response = requests.get(f"{BASE_URL}/partners", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_partners = "partners" in data and isinstance(data["partners"], list)
        is_empty = has_partners and len(data["partners"]) == 0
        
        # Check for ObjectID leakage
        objectid_issues = check_no_objectid(data)
        
        passed = has_partners and is_empty and len(objectid_issues) == 0
        details = f"Has partners field: {has_partners}, Empty: {is_empty}"
        if objectid_issues:
            details += f", ObjectID issues: {objectid_issues}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/partners empty list (200)", passed, details)
except Exception as e:
    record_result("GET /api/partners empty list (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 32: POST /api/partners - Without Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 32: POST /api/partners - Without Token (401){RESET}")
try:
    payload = {
        "partnerName": "Test Partner",
        "birthDate": "1991-05-10",
        "birthTime": "09:15",
        "overall": 77,
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload)
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/partners without token (401)", passed, details)
except Exception as e:
    record_result("POST /api/partners without token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 33: POST /api/partners - Valid Data First Time (201)
# ============================================================================
print(f"\n{YELLOW}TEST 33: POST /api/partners - Valid Data First Time (201){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "partnerName": "Stellar Phoenix",
        "birthDate": "1991-05-10",
        "birthTime": "09:15",
        "overall": 77,
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 201
    if passed:
        data = response.json()
        has_partner = "partner" in data and isinstance(data["partner"], dict)
        
        if has_partner:
            partner = data["partner"]
            has_id = "id" in partner and is_uuid(partner["id"])
            has_no_underscore_id = "_id" not in partner
            has_name = "partnerName" in partner and partner["partnerName"] == "Stellar Phoenix"
            has_overall = "overall" in partner and partner["overall"] == 77
            has_verdict = "verdict" in partner and partner["verdict"] == "A Karmic Match"
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = has_id and has_no_underscore_id and has_name and has_overall and has_verdict and len(objectid_issues) == 0
            details = f"UUID: {has_id}, No _id: {has_no_underscore_id}, Name: {has_name}, Overall: {has_overall}, Verdict: {has_verdict}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
            
            # Save partner ID for later tests
            if passed:
                PARTNER_ID = partner["id"]
        else:
            passed = False
            details = "Missing 'partner' object in response"
    else:
        details = f"Expected 201, got {response.status_code}: {response.text}"
    
    record_result("POST /api/partners first time (201)", passed, details)
except Exception as e:
    record_result("POST /api/partners first time (201)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 34: POST /api/partners - Same Name+Date, Different Overall (200 Upsert)
# ============================================================================
print(f"\n{YELLOW}TEST 34: POST /api/partners - Same Name+Date, Different Overall (200 Upsert){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "partnerName": "Stellar Phoenix",  # Same name
        "birthDate": "1991-05-10",  # Same date
        "birthTime": "09:15",
        "overall": 80,  # Different overall
        "verdict": "A Karmic Match Updated"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_partner = "partner" in data and isinstance(data["partner"], dict)
        
        if has_partner:
            partner = data["partner"]
            same_id = partner.get("id") == PARTNER_ID
            updated_overall = partner.get("overall") == 80
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = same_id and updated_overall and len(objectid_issues) == 0
            details = f"Same ID: {same_id}, Updated overall to 80: {updated_overall}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = "Missing 'partner' object in response"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("POST /api/partners upsert (200)", passed, details)
except Exception as e:
    record_result("POST /api/partners upsert (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 35: POST /api/partners - Missing partnerName (400)
# ============================================================================
print(f"\n{YELLOW}TEST 35: POST /api/partners - Missing partnerName (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "birthDate": "1991-05-10",
        "birthTime": "09:15",
        "overall": 77,
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/partners missing partnerName (400)", passed, details)
except Exception as e:
    record_result("POST /api/partners missing partnerName (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 36: POST /api/partners - Bad Date Format (400)
# ============================================================================
print(f"\n{YELLOW}TEST 36: POST /api/partners - Bad Date Format (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "partnerName": "Test Partner",
        "birthDate": "10-05-1991",  # Wrong format
        "birthTime": "09:15",
        "overall": 77,
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/partners bad date format (400)", passed, details)
except Exception as e:
    record_result("POST /api/partners bad date format (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 37: POST /api/partners - Bad Time Format (400)
# ============================================================================
print(f"\n{YELLOW}TEST 37: POST /api/partners - Bad Time Format (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "partnerName": "Test Partner",
        "birthDate": "1991-05-10",
        "birthTime": "9am",  # Wrong format
        "overall": 77,
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/partners bad time format (400)", passed, details)
except Exception as e:
    record_result("POST /api/partners bad time format (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 38: POST /api/partners - Overall > 100 (400)
# ============================================================================
print(f"\n{YELLOW}TEST 38: POST /api/partners - Overall > 100 (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "partnerName": "Test Partner",
        "birthDate": "1991-05-10",
        "birthTime": "09:15",
        "overall": 150,  # Out of range
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/partners overall > 100 (400)", passed, details)
except Exception as e:
    record_result("POST /api/partners overall > 100 (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 39: POST /api/partners - Overall as String (400)
# ============================================================================
print(f"\n{YELLOW}TEST 39: POST /api/partners - Overall as String (400){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    payload = {
        "partnerName": "Test Partner",
        "birthDate": "1991-05-10",
        "birthTime": "09:15",
        "overall": "high",  # String instead of number
        "verdict": "A Karmic Match"
    }
    response = requests.post(f"{BASE_URL}/partners", json=payload, headers=headers)
    
    passed = response.status_code == 400
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("POST /api/partners overall as string (400)", passed, details)
except Exception as e:
    record_result("POST /api/partners overall as string (400)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 40: GET /api/partners - With Token, Contains Partner (200)
# ============================================================================
print(f"\n{YELLOW}TEST 40: GET /api/partners - With Token, Contains Partner (200){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    response = requests.get(f"{BASE_URL}/partners", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_partners = "partners" in data and isinstance(data["partners"], list)
        has_one_partner = has_partners and len(data["partners"]) == 1
        
        if has_one_partner:
            partner = data["partners"][0]
            correct_id = partner.get("id") == PARTNER_ID
            correct_name = partner.get("partnerName") == "Stellar Phoenix"
            correct_overall = partner.get("overall") == 80
            
            # Check for ObjectID leakage
            objectid_issues = check_no_objectid(data)
            
            passed = correct_id and correct_name and correct_overall and len(objectid_issues) == 0
            details = f"Has 1 partner: {has_one_partner}, Correct ID: {correct_id}, Name: {correct_name}, Overall: {correct_overall}"
            if objectid_issues:
                details += f", ObjectID issues: {objectid_issues}"
        else:
            passed = False
            details = f"Expected 1 partner, got {len(data.get('partners', []))}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/partners contains partner (200)", passed, details)
except Exception as e:
    record_result("GET /api/partners contains partner (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 41: DELETE /api/partners/:id - Without Token (401)
# ============================================================================
print(f"\n{YELLOW}TEST 41: DELETE /api/partners/:id - Without Token (401){RESET}")
try:
    response = requests.delete(f"{BASE_URL}/partners/{PARTNER_ID}")
    
    passed = response.status_code == 401
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("DELETE /api/partners/:id without token (401)", passed, details)
except Exception as e:
    record_result("DELETE /api/partners/:id without token (401)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 42: DELETE /api/partners/:id - With Token (200)
# ============================================================================
print(f"\n{YELLOW}TEST 42: DELETE /api/partners/:id - With Token (200){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    response = requests.delete(f"{BASE_URL}/partners/{PARTNER_ID}", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_ok = "ok" in data and data["ok"] is True
        
        passed = has_ok
        details = f"Response ok: {has_ok}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("DELETE /api/partners/:id with token (200)", passed, details)
except Exception as e:
    record_result("DELETE /api/partners/:id with token (200)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 43: GET /api/partners - After Delete, Empty List (200)
# ============================================================================
print(f"\n{YELLOW}TEST 43: GET /api/partners - After Delete, Empty List (200){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    response = requests.get(f"{BASE_URL}/partners", headers=headers)
    
    passed = response.status_code == 200
    if passed:
        data = response.json()
        has_partners = "partners" in data and isinstance(data["partners"], list)
        is_empty = has_partners and len(data["partners"]) == 0
        
        passed = has_partners and is_empty
        details = f"Has partners field: {has_partners}, Empty: {is_empty}"
    else:
        details = f"Expected 200, got {response.status_code}: {response.text}"
    
    record_result("GET /api/partners after delete (empty)", passed, details)
except Exception as e:
    record_result("GET /api/partners after delete (empty)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 44: DELETE /api/partners/:id - Same ID Again (404)
# ============================================================================
print(f"\n{YELLOW}TEST 44: DELETE /api/partners/:id - Same ID Again (404){RESET}")
try:
    headers = {"Authorization": f"Bearer {THROWAWAY_TOKEN}"}
    response = requests.delete(f"{BASE_URL}/partners/{PARTNER_ID}", headers=headers)
    
    passed = response.status_code == 404
    details = f"Status: {response.status_code}"
    if not passed:
        details += f", Response: {response.text}"
    
    record_result("DELETE /api/partners/:id same ID again (404)", passed, details)
except Exception as e:
    record_result("DELETE /api/partners/:id same ID again (404)", False, f"Exception: {str(e)}")

# ============================================================================
# TEST 45: Login as luna@zaura.app - Verify Her 2 Partners Exist
# ============================================================================
print(f"\n{YELLOW}TEST 45: Login as luna@zaura.app - Verify Her 2 Partners Exist{RESET}")
try:
    payload = {
        "email": "luna@zaura.app",
        "password": "cosmic123"
    }
    response = requests.post(f"{BASE_URL}/auth/login", json=payload)
    
    if response.status_code == 200:
        data = response.json()
        luna_token = data["token"]
        
        # Get luna's partners
        headers = {"Authorization": f"Bearer {luna_token}"}
        response = requests.get(f"{BASE_URL}/partners", headers=headers)
        
        passed = response.status_code == 200
        if passed:
            data = response.json()
            has_partners = "partners" in data and isinstance(data["partners"], list)
            has_two_partners = has_partners and len(data["partners"]) == 2
            
            if has_two_partners:
                partner_names = [p.get("partnerName") for p in data["partners"]]
                has_river = "River Sage" in partner_names
                has_orion = "Orion Vale" in partner_names
                no_throwaway = PARTNER_ID not in [p.get("id") for p in data["partners"]]
                
                # Check for ObjectID leakage
                objectid_issues = check_no_objectid(data)
                
                passed = has_river and has_orion and no_throwaway and len(objectid_issues) == 0
                details = f"Has 2 partners: {has_two_partners}, River Sage: {has_river}, Orion Vale: {has_orion}, No throwaway partner: {no_throwaway}"
                if objectid_issues:
                    details += f", ObjectID issues: {objectid_issues}"
            else:
                passed = False
                details = f"Expected 2 partners, got {len(data.get('partners', []))}"
        else:
            details = f"Expected 200, got {response.status_code}: {response.text}"
        
        record_result("Luna has 2 partners (isolation test)", passed, details)
    else:
        record_result("Luna has 2 partners (isolation test)", False, f"Failed to login as luna: {response.status_code}")
except Exception as e:
    record_result("Luna has 2 partners (isolation test)", False, f"Exception: {str(e)}")

# ============================================================================
# SUMMARY
# ============================================================================
print(f"\n{BLUE}{'='*60}{RESET}")
print(f"{BLUE}Test Summary{RESET}")
print(f"{BLUE}{'='*60}{RESET}")
print(f"Total Tests: {results['passed'] + results['failed']}")
print(f"{GREEN}Passed: {results['passed']}{RESET}")
print(f"{RED}Failed: {results['failed']}{RESET}")

if results['failed'] > 0:
    print(f"\n{RED}Failed Tests:{RESET}")
    for test in results['tests']:
        if not test['passed']:
            print(f"  - {test['name']}")
            if test['details']:
                print(f"    {test['details']}")

print(f"\n{BLUE}{'='*60}{RESET}\n")

# Exit with appropriate code
exit(0 if results['failed'] == 0 else 1)
