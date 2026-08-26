#!/usr/bin/env python3
"""
Backend API test suite for Zaura - Bond Notifications API
Tests the notification endpoints added to /app/app/api/[[...path]]/route.js
"""

import requests
import json
import time
import random
import string
from datetime import datetime

# Base URL from .env
BASE_URL = "https://soul-compass-58.preview.emergentagent.com/api"

# Test credentials
LUNA_EMAIL = "luna@zaura.app"
LUNA_PASSWORD = "cosmic123"
LUNA_INVITE_CODE = "f572fce1"

# Colors for output
GREEN = '\033[92m'
RED = '\033[91m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
RESET = '\033[0m'

def log_test(name, passed, details=""):
    status = f"{GREEN}✅ PASSED{RESET}" if passed else f"{RED}❌ FAILED{RESET}"
    print(f"{status} - {name}")
    if details:
        print(f"  {details}")

def log_section(name):
    print(f"\n{BLUE}{'='*80}{RESET}")
    print(f"{BLUE}{name}{RESET}")
    print(f"{BLUE}{'='*80}{RESET}\n")

def generate_random_email():
    """Generate a random email for throwaway user"""
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"notif_test_{random_str}@test.zaura.app"

# Test counters
total_tests = 0
passed_tests = 0

def run_test(name, test_func):
    global total_tests, passed_tests
    total_tests += 1
    try:
        result = test_func()
        if result:
            passed_tests += 1
            log_test(name, True)
        else:
            log_test(name, False)
        return result
    except Exception as e:
        log_test(name, False, f"Exception: {str(e)}")
        return False

# ============================================================================
# TEST 1: GET /api/notifications without Authorization → 401
# ============================================================================
def test_notifications_no_auth():
    log_section("TEST 1: GET /api/notifications without Authorization")
    response = requests.get(f"{BASE_URL}/notifications")
    success = response.status_code == 401
    if not success:
        print(f"  Expected 401, got {response.status_code}")
    return success

# ============================================================================
# TEST 2: Login as luna@zaura.app → get token
# ============================================================================
def test_login_luna():
    log_section("TEST 2: Login as luna@zaura.app")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "email": LUNA_EMAIL,
        "password": LUNA_PASSWORD
    })
    success = response.status_code == 200 and "token" in response.json()
    if success:
        global luna_token, luna_user_id
        luna_token = response.json()["token"]
        luna_user_id = response.json()["user"]["id"]
        print(f"  Luna token: {luna_token[:20]}...")
        print(f"  Luna user ID: {luna_user_id}")
    else:
        print(f"  Login failed: {response.status_code} - {response.text}")
    return success

# ============================================================================
# TEST 3: GET /api/notifications as luna → 200, empty array, unreadCount=0
# ============================================================================
def test_notifications_empty():
    log_section("TEST 3: GET /api/notifications as luna (should be empty)")
    headers = {"Authorization": f"Bearer {luna_token}"}
    response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    success = (
        response.status_code == 200 and
        "notifications" in response.json() and
        isinstance(response.json()["notifications"], list) and
        len(response.json()["notifications"]) == 0 and
        response.json().get("unreadCount") == 0
    )
    if success:
        print(f"  Notifications: {response.json()['notifications']}")
        print(f"  Unread count: {response.json()['unreadCount']}")
    else:
        print(f"  Failed: {response.status_code} - {response.json()}")
    return success

# ============================================================================
# TEST 4: Register throwaway user + create birth profile
# ============================================================================
def test_register_throwaway():
    log_section("TEST 4: Register throwaway user + create birth profile")
    global throwaway_email, throwaway_token, throwaway_user_id
    
    # Register
    throwaway_email = generate_random_email()
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "email": throwaway_email,
        "password": "cosmic123",
        "name": "Notif Test"
    })
    
    if response.status_code != 201:
        print(f"  Registration failed: {response.status_code} - {response.text}")
        return False
    
    throwaway_token = response.json()["token"]
    throwaway_user_id = response.json()["user"]["id"]
    print(f"  Registered: {throwaway_email}")
    print(f"  Token: {throwaway_token[:20]}...")
    print(f"  User ID: {throwaway_user_id}")
    
    # Create birth profile
    headers = {"Authorization": f"Bearer {throwaway_token}"}
    profile_response = requests.post(f"{BASE_URL}/profile", headers=headers, json={
        "fullName": "Notif Test",
        "birthDate": "1994-06-15",
        "birthTime": "10:00",
        "birthCity": "London, UK",
        "lat": 51.5074,
        "lng": -0.1278
    })
    
    success = profile_response.status_code in [200, 201]
    if success:
        print(f"  Birth profile created: {profile_response.json()}")
    else:
        print(f"  Profile creation failed: {profile_response.status_code} - {profile_response.text}")
    
    return success

# ============================================================================
# TEST 5: As throwaway, POST /api/invite/f572fce1/accept → 200
# ============================================================================
def test_accept_invite():
    log_section("TEST 5: As throwaway, POST /api/invite/f572fce1/accept")
    headers = {"Authorization": f"Bearer {throwaway_token}"}
    response = requests.post(f"{BASE_URL}/invite/{LUNA_INVITE_CODE}/accept", headers=headers)
    
    success = (
        response.status_code == 200 and
        "partnerId" in response.json() and
        "inviterName" in response.json()
    )
    
    if success:
        global throwaway_partner_id
        throwaway_partner_id = response.json()["partnerId"]
        print(f"  Partner ID: {throwaway_partner_id}")
        print(f"  Inviter name: {response.json()['inviterName']}")
    else:
        print(f"  Failed: {response.status_code} - {response.json()}")
    
    return success

# ============================================================================
# TEST 6: GET /api/notifications as luna → 1 bond_joined notification
# ============================================================================
def test_notification_created():
    log_section("TEST 6: GET /api/notifications as luna → 1 bond_joined notification")
    headers = {"Authorization": f"Bearer {luna_token}"}
    response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    
    if response.status_code != 200:
        print(f"  Failed: {response.status_code} - {response.text}")
        return False
    
    data = response.json()
    notifications = data.get("notifications", [])
    unread_count = data.get("unreadCount", 0)
    
    # Should have exactly 1 notification
    if len(notifications) != 1:
        print(f"  Expected 1 notification, got {len(notifications)}")
        return False
    
    notif = notifications[0]
    global luna_notification_id
    luna_notification_id = notif.get("id")
    
    # Verify all required fields
    required_fields = ["id", "userId", "kind", "joinerId", "inviteCode", "partnerId", 
                      "friendFirstName", "friendFullName", "overall", "verdict", "readAt", "createdAt"]
    
    missing_fields = [f for f in required_fields if f not in notif]
    if missing_fields:
        print(f"  Missing fields: {missing_fields}")
        return False
    
    # Verify field values
    checks = [
        (notif["userId"] == luna_user_id, f"userId should be {luna_user_id}, got {notif['userId']}"),
        (notif["kind"] == "bond_joined", f"kind should be 'bond_joined', got {notif['kind']}"),
        (notif["joinerId"] == throwaway_user_id, f"joinerId should be {throwaway_user_id}, got {notif['joinerId']}"),
        (notif["inviteCode"] == LUNA_INVITE_CODE, f"inviteCode should be {LUNA_INVITE_CODE}, got {notif['inviteCode']}"),
        (notif["friendFirstName"] == "Notif", f"friendFirstName should be 'Notif', got {notif['friendFirstName']}"),
        (notif["friendFullName"] == "Notif Test", f"friendFullName should be 'Notif Test', got {notif['friendFullName']}"),
        (isinstance(notif["overall"], (int, float)) and 0 <= notif["overall"] <= 100, f"overall should be 0-100, got {notif['overall']}"),
        (isinstance(notif["verdict"], str) and len(notif["verdict"]) > 0, f"verdict should be non-empty string, got {notif['verdict']}"),
        (notif["readAt"] is None, f"readAt should be null, got {notif['readAt']}"),
        ("_id" not in notif, "MongoDB _id should not be present"),
        (unread_count == 1, f"unreadCount should be 1, got {unread_count}")
    ]
    
    all_passed = True
    for check, msg in checks:
        if not check:
            print(f"  ❌ {msg}")
            all_passed = False
    
    if all_passed:
        print(f"  ✅ All fields verified:")
        print(f"     id: {notif['id']}")
        print(f"     userId: {notif['userId']}")
        print(f"     kind: {notif['kind']}")
        print(f"     joinerId: {notif['joinerId']}")
        print(f"     inviteCode: {notif['inviteCode']}")
        print(f"     partnerId: {notif['partnerId']}")
        print(f"     friendFirstName: {notif['friendFirstName']}")
        print(f"     friendFullName: {notif['friendFullName']}")
        print(f"     overall: {notif['overall']}")
        print(f"     verdict: {notif['verdict']}")
        print(f"     readAt: {notif['readAt']}")
        print(f"     createdAt: {notif['createdAt']}")
        print(f"     unreadCount: {unread_count}")
    
    return all_passed

# ============================================================================
# TEST 7: Repeat accept → idempotent, no duplicate
# ============================================================================
def test_idempotent_accept():
    log_section("TEST 7: Repeat accept → idempotent, no duplicate")
    headers = {"Authorization": f"Bearer {throwaway_token}"}
    
    # Accept again
    response = requests.post(f"{BASE_URL}/invite/{LUNA_INVITE_CODE}/accept", headers=headers)
    if response.status_code != 200:
        print(f"  Repeat accept failed: {response.status_code} - {response.text}")
        return False
    
    print(f"  Repeat accept succeeded")
    
    # Check luna's notifications - should still be exactly 1
    luna_headers = {"Authorization": f"Bearer {luna_token}"}
    notif_response = requests.get(f"{BASE_URL}/notifications", headers=luna_headers)
    
    if notif_response.status_code != 200:
        print(f"  Failed to get notifications: {notif_response.status_code}")
        return False
    
    notifications = notif_response.json().get("notifications", [])
    success = len(notifications) == 1
    
    if success:
        print(f"  ✅ Still exactly 1 notification (idempotent)")
    else:
        print(f"  ❌ Expected 1 notification, got {len(notifications)}")
    
    return success

# ============================================================================
# TEST 8: PATCH /api/notifications/:id/read → 200, readAt set
# ============================================================================
def test_mark_notification_read():
    log_section("TEST 8: PATCH /api/notifications/:id/read")
    headers = {"Authorization": f"Bearer {luna_token}"}
    
    # Mark as read
    response = requests.patch(f"{BASE_URL}/notifications/{luna_notification_id}/read", headers=headers)
    
    if response.status_code != 200:
        print(f"  Failed: {response.status_code} - {response.text}")
        return False
    
    if not response.json().get("ok"):
        print(f"  Response missing 'ok: true': {response.json()}")
        return False
    
    print(f"  ✅ PATCH returned ok: true")
    
    # Verify readAt is set
    notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    if notif_response.status_code != 200:
        print(f"  Failed to get notifications: {notif_response.status_code}")
        return False
    
    data = notif_response.json()
    notifications = data.get("notifications", [])
    unread_count = data.get("unreadCount", 0)
    
    if len(notifications) != 1:
        print(f"  Expected 1 notification, got {len(notifications)}")
        return False
    
    notif = notifications[0]
    success = (
        notif["readAt"] is not None and
        isinstance(notif["readAt"], str) and
        unread_count == 0
    )
    
    if success:
        print(f"  ✅ readAt is set: {notif['readAt']}")
        print(f"  ✅ unreadCount is 0")
    else:
        print(f"  ❌ readAt: {notif['readAt']}, unreadCount: {unread_count}")
    
    return success

# ============================================================================
# TEST 9: PATCH /api/notifications/nonexistent/read → 404
# ============================================================================
def test_mark_nonexistent_read():
    log_section("TEST 9: PATCH /api/notifications/nonexistent/read → 404")
    headers = {"Authorization": f"Bearer {luna_token}"}
    
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = requests.patch(f"{BASE_URL}/notifications/{fake_id}/read", headers=headers)
    
    success = response.status_code == 404
    if success:
        print(f"  ✅ Got 404 as expected")
    else:
        print(f"  ❌ Expected 404, got {response.status_code}")
    
    return success

# ============================================================================
# TEST 10: PATCH without token → 401
# ============================================================================
def test_mark_read_no_auth():
    log_section("TEST 10: PATCH /api/notifications/:id/read without token → 401")
    
    response = requests.patch(f"{BASE_URL}/notifications/{luna_notification_id}/read")
    
    success = response.status_code == 401
    if success:
        print(f"  ✅ Got 401 as expected")
    else:
        print(f"  ❌ Expected 401, got {response.status_code}")
    
    return success

# ============================================================================
# TEST 11: DELETE /api/notifications/:id → 200, then 404 on repeat
# ============================================================================
def test_delete_notification():
    log_section("TEST 11: DELETE /api/notifications/:id")
    headers = {"Authorization": f"Bearer {luna_token}"}
    
    # Delete
    response = requests.delete(f"{BASE_URL}/notifications/{luna_notification_id}", headers=headers)
    
    if response.status_code != 200:
        print(f"  Delete failed: {response.status_code} - {response.text}")
        return False
    
    if not response.json().get("ok"):
        print(f"  Response missing 'ok: true': {response.json()}")
        return False
    
    print(f"  ✅ DELETE returned ok: true")
    
    # Verify it's gone
    notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    if notif_response.status_code != 200:
        print(f"  Failed to get notifications: {notif_response.status_code}")
        return False
    
    notifications = notif_response.json().get("notifications", [])
    if len(notifications) != 0:
        print(f"  ❌ Expected 0 notifications, got {len(notifications)}")
        return False
    
    print(f"  ✅ Notification deleted (list is empty)")
    
    # Try to delete again - should get 404
    repeat_response = requests.delete(f"{BASE_URL}/notifications/{luna_notification_id}", headers=headers)
    if repeat_response.status_code != 404:
        print(f"  ❌ Expected 404 on repeat delete, got {repeat_response.status_code}")
        return False
    
    print(f"  ✅ Repeat delete returned 404")
    
    return True

# ============================================================================
# TEST 12: DELETE without token → 401
# ============================================================================
def test_delete_no_auth():
    log_section("TEST 12: DELETE /api/notifications/:id without token → 401")
    
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = requests.delete(f"{BASE_URL}/notifications/{fake_id}")
    
    success = response.status_code == 401
    if success:
        print(f"  ✅ Got 401 as expected")
    else:
        print(f"  ❌ Expected 401, got {response.status_code}")
    
    return success

# ============================================================================
# TEST 13: Trigger another notification, PATCH /api/notifications (mark ALL read)
# ============================================================================
def test_mark_all_read():
    log_section("TEST 13: Trigger another notification, PATCH /api/notifications (mark ALL read)")
    headers_throwaway = {"Authorization": f"Bearer {throwaway_token}"}
    headers_luna = {"Authorization": f"Bearer {luna_token}"}
    
    # Accept invite again (should recreate notification since previous was deleted)
    response = requests.post(f"{BASE_URL}/invite/{LUNA_INVITE_CODE}/accept", headers=headers_throwaway)
    if response.status_code != 200:
        print(f"  Accept failed: {response.status_code} - {response.text}")
        return False
    
    print(f"  ✅ Invite accepted again")
    
    # Check luna's notifications - should have 1 new notification
    notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers_luna)
    if notif_response.status_code != 200:
        print(f"  Failed to get notifications: {notif_response.status_code}")
        return False
    
    notifications = notif_response.json().get("notifications", [])
    if len(notifications) != 1:
        print(f"  ❌ Expected 1 notification, got {len(notifications)}")
        return False
    
    print(f"  ✅ New notification created")
    
    global luna_notification_id_2
    luna_notification_id_2 = notifications[0]["id"]
    
    # Mark ALL as read (PATCH /api/notifications without id)
    mark_all_response = requests.patch(f"{BASE_URL}/notifications", headers=headers_luna)
    if mark_all_response.status_code != 200:
        print(f"  Mark all read failed: {mark_all_response.status_code} - {mark_all_response.text}")
        return False
    
    if not mark_all_response.json().get("ok"):
        print(f"  Response missing 'ok: true': {mark_all_response.json()}")
        return False
    
    print(f"  ✅ PATCH /api/notifications returned ok: true")
    
    # Verify all are marked as read
    verify_response = requests.get(f"{BASE_URL}/notifications", headers=headers_luna)
    if verify_response.status_code != 200:
        print(f"  Failed to get notifications: {verify_response.status_code}")
        return False
    
    data = verify_response.json()
    notifications = data.get("notifications", [])
    unread_count = data.get("unreadCount", 0)
    
    all_read = all(n["readAt"] is not None for n in notifications)
    success = all_read and unread_count == 0
    
    if success:
        print(f"  ✅ All notifications marked as read")
        print(f"  ✅ unreadCount is 0")
    else:
        print(f"  ❌ Not all notifications marked as read or unreadCount != 0")
        for n in notifications:
            print(f"     {n['id']}: readAt={n['readAt']}")
    
    return success

# ============================================================================
# TEST 14: User isolation - throwaway GET /api/notifications → empty
# ============================================================================
def test_user_isolation():
    log_section("TEST 14: User isolation - throwaway GET /api/notifications → empty")
    headers = {"Authorization": f"Bearer {throwaway_token}"}
    
    response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    
    if response.status_code != 200:
        print(f"  Failed: {response.status_code} - {response.text}")
        return False
    
    notifications = response.json().get("notifications", [])
    success = len(notifications) == 0
    
    if success:
        print(f"  ✅ Throwaway user has 0 notifications (correct isolation)")
    else:
        print(f"  ❌ Throwaway user has {len(notifications)} notifications (should be 0)")
    
    return success

# ============================================================================
# TEST 15: Cleanup - delete throwaway partner, delete notifications
# ============================================================================
def test_cleanup():
    log_section("TEST 15: Cleanup - delete throwaway partner and notifications")
    headers = {"Authorization": f"Bearer {luna_token}"}
    
    # Get luna's partners
    partners_response = requests.get(f"{BASE_URL}/partners", headers=headers)
    if partners_response.status_code != 200:
        print(f"  Failed to get partners: {partners_response.status_code}")
        return False
    
    partners = partners_response.json().get("partners", [])
    print(f"  Luna has {len(partners)} partners")
    
    # Find the throwaway partner (Notif Test)
    throwaway_partner = None
    for p in partners:
        if p["partnerName"] == "Notif Test":
            throwaway_partner = p
            break
    
    if not throwaway_partner:
        print(f"  ❌ Could not find throwaway partner 'Notif Test'")
        return False
    
    print(f"  Found throwaway partner: {throwaway_partner['id']}")
    
    # Delete the throwaway partner
    delete_response = requests.delete(f"{BASE_URL}/partners/{throwaway_partner['id']}", headers=headers)
    if delete_response.status_code != 200:
        print(f"  Failed to delete partner: {delete_response.status_code} - {delete_response.text}")
        return False
    
    print(f"  ✅ Deleted throwaway partner")
    
    # Delete all notifications
    notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    if notif_response.status_code != 200:
        print(f"  Failed to get notifications: {notif_response.status_code}")
        return False
    
    notifications = notif_response.json().get("notifications", [])
    print(f"  Luna has {len(notifications)} notifications to delete")
    
    for notif in notifications:
        del_response = requests.delete(f"{BASE_URL}/notifications/{notif['id']}", headers=headers)
        if del_response.status_code != 200:
            print(f"  Failed to delete notification {notif['id']}: {del_response.status_code}")
            return False
    
    print(f"  ✅ Deleted all notifications")
    
    # Verify luna is back to 3 partners
    final_partners_response = requests.get(f"{BASE_URL}/partners", headers=headers)
    if final_partners_response.status_code != 200:
        print(f"  Failed to get partners: {final_partners_response.status_code}")
        return False
    
    final_partners = final_partners_response.json().get("partners", [])
    expected_partners = ["Sage Moon", "Orion Vale", "River Sage"]
    partner_names = [p["partnerName"] for p in final_partners]
    
    success = len(final_partners) == 3 and all(name in partner_names for name in expected_partners)
    
    if success:
        print(f"  ✅ Luna has 3 partners: {partner_names}")
    else:
        print(f"  ❌ Luna has {len(final_partners)} partners: {partner_names}")
        print(f"     Expected: {expected_partners}")
    
    # Verify notifications are empty
    final_notif_response = requests.get(f"{BASE_URL}/notifications", headers=headers)
    if final_notif_response.status_code != 200:
        print(f"  Failed to get notifications: {final_notif_response.status_code}")
        return False
    
    final_notifications = final_notif_response.json().get("notifications", [])
    if len(final_notifications) == 0:
        print(f"  ✅ Luna has 0 notifications")
    else:
        print(f"  ❌ Luna has {len(final_notifications)} notifications (should be 0)")
        success = False
    
    return success

# ============================================================================
# RUN ALL TESTS
# ============================================================================
def main():
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}Bond Notifications API - Backend Test Suite{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}\n")
    
    # Run tests in sequence
    run_test("GET /api/notifications without Authorization → 401", test_notifications_no_auth)
    run_test("Login as luna@zaura.app", test_login_luna)
    run_test("GET /api/notifications as luna → empty", test_notifications_empty)
    run_test("Register throwaway user + create birth profile", test_register_throwaway)
    run_test("As throwaway, POST /api/invite/f572fce1/accept", test_accept_invite)
    run_test("GET /api/notifications as luna → 1 bond_joined notification", test_notification_created)
    run_test("Repeat accept → idempotent, no duplicate", test_idempotent_accept)
    run_test("PATCH /api/notifications/:id/read → readAt set", test_mark_notification_read)
    run_test("PATCH /api/notifications/nonexistent/read → 404", test_mark_nonexistent_read)
    run_test("PATCH without token → 401", test_mark_read_no_auth)
    run_test("DELETE /api/notifications/:id → 200, then 404", test_delete_notification)
    run_test("DELETE without token → 401", test_delete_no_auth)
    run_test("PATCH /api/notifications (mark ALL read)", test_mark_all_read)
    run_test("User isolation - throwaway notifications empty", test_user_isolation)
    run_test("Cleanup - delete throwaway partner and notifications", test_cleanup)
    
    # Summary
    print(f"\n{YELLOW}{'='*80}{RESET}")
    print(f"{YELLOW}TEST SUMMARY{RESET}")
    print(f"{YELLOW}{'='*80}{RESET}\n")
    
    if passed_tests == total_tests:
        print(f"{GREEN}✅ ALL {total_tests} TESTS PASSED{RESET}")
    else:
        print(f"{RED}❌ {total_tests - passed_tests} of {total_tests} tests FAILED{RESET}")
        print(f"{GREEN}✅ {passed_tests} tests passed{RESET}")
    
    print()

if __name__ == "__main__":
    main()
