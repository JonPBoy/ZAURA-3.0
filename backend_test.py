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
