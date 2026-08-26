#====================================================================================================
# START - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================

# THIS SECTION CONTAINS CRITICAL TESTING INSTRUCTIONS FOR BOTH AGENTS
# BOTH MAIN_AGENT AND TESTING_AGENT MUST PRESERVE THIS ENTIRE BLOCK

# Communication Protocol:
# If the `testing_agent` is available, main agent should delegate all testing tasks to it.
#
# You have access to a file called `test_result.md`. This file contains the complete testing state
# and history, and is the primary means of communication between main and the testing agent.
#
# Main and testing agents must follow this exact format to maintain testing data. 
# The testing data must be entered in yaml format Below is the data structure:
# 
## user_problem_statement: {problem_statement}
## backend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.py"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## frontend:
##   - task: "Task name"
##     implemented: true
##     working: true  # or false or "NA"
##     file: "file_path.js"
##     stuck_count: 0
##     priority: "high"  # or "medium" or "low"
##     needs_retesting: false
##     status_history:
##         -working: true  # or false or "NA"
##         -agent: "main"  # or "testing" or "user"
##         -comment: "Detailed comment about status"
##
## metadata:
##   created_by: "main_agent"
##   version: "1.0"
##   test_sequence: 0
##   run_ui: false
##
## test_plan:
##   current_focus:
##     - "Task name 1"
##     - "Task name 2"
##   stuck_tasks:
##     - "Task name with persistent issues"
##   test_all: false
##   test_priority: "high_first"  # or "sequential" or "stuck_first"
##
## agent_communication:
##     -agent: "main"  # or "testing" or "user"
##     -message: "Communication message between agents"

# Protocol Guidelines for Main agent
#
# 1. Update Test Result File Before Testing:
#    - Main agent must always update the `test_result.md` file before calling the testing agent
#    - Add implementation details to the status_history
#    - Set `needs_retesting` to true for tasks that need testing
#    - Update the `test_plan` section to guide testing priorities
#    - Add a message to `agent_communication` explaining what you've done
#
# 2. Incorporate User Feedback:
#    - When a user provides feedback that something is or isn't working, add this information to the relevant task's status_history
#    - Update the working status based on user feedback
#    - If a user reports an issue with a task that was marked as working, increment the stuck_count
#    - Whenever user reports issue in the app, if we have testing agent and task_result.md file so find the appropriate task for that and append in status_history of that task to contain the user concern and problem as well 
#
# 3. Track Stuck Tasks:
#    - Monitor which tasks have high stuck_count values or where you are fixing same issue again and again, analyze that when you read task_result.md
#    - For persistent issues, use websearch tool to find solutions
#    - Pay special attention to tasks in the stuck_tasks list
#    - When you fix an issue with a stuck task, don't reset the stuck_count until the testing agent confirms it's working
#
# 4. Provide Context to Testing Agent:
#    - When calling the testing agent, provide clear instructions about:
#      - Which tasks need testing (reference the test_plan)
#      - Any authentication details or configuration needed
#      - Specific test scenarios to focus on
#      - Any known issues or edge cases to verify
#
# 5. Call the testing agent with specific instructions referring to test_result.md
#
# IMPORTANT: Main agent must ALWAYS update test_result.md BEFORE calling the testing agent, as it relies on this file to understand what to test next.

#====================================================================================================
# END - Testing Protocol - DO NOT EDIT OR REMOVE THIS SECTION
#====================================================================================================



#====================================================================================================
# Testing Data - Main Agent and testing sub agent both should log testing data below this section
#====================================================================================================

user_problem_statement: "Zaura - mystical self-discovery web app. Users register/login, enter birth info (name, date, optional time, optional city), and receive a personalized cosmic profile across 20 esoteric modalities (Western/Vedic/Chinese/Celtic/Egyptian/Mayan/Hellenistic astrology, moon phase, numerology, destiny matrix, name analysis, human design, gene keys, I Ching, kabbalah, tarot, enneagram, soul age, spirit animal, chakra). Dark glassmorphic UI with dashboard grid, category filters, 3D flip card, and detail view with prev/next navigation. Adapted from Vite/Supabase spec to Next.js + MongoDB."

backend:
  - task: "Auth API - register/login/logout/me (Node crypto scrypt hashing, Bearer token sessions in MongoDB)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Implemented POST /api/auth/register, /api/auth/login, /api/auth/logout, GET /api/auth/me. Verified register via curl - returns token + user with UUID. Test user: luna@zaura.app / cosmic123 (see /app/memory/test_credentials.md)."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing completed - ALL 10 auth tests PASSED: ✅ Register (201 success, 409 duplicate, 400 invalid email, 400 weak password), ✅ Login (200 success, 401 wrong password, 401 unknown email), ✅ GET /api/auth/me (200 with token, 401 without token, 401 garbage token), ✅ Logout (200 success, token invalidated). All responses return UUIDs, no MongoDB ObjectID leakage detected."

  - task: "Birth profile API - POST/GET/DELETE /api/profile with validation and upsert"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Implemented with auth required (Bearer token), validates fullName/birthDate format/range, optional birthTime HH:MM, optional city + lat/lng. Upserts one profile per user. Verified via UI screenshot flow (profile saved, dashboard rendered)."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing completed - ALL 12 profile tests PASSED: ✅ POST /api/profile (201 first time, 200 upsert with same ID, 400 missing fullName, 400 bad date format, 400 out of range date, 400 bad time format, 401 no token), ✅ GET /api/profile (returns saved profile with UUIDs), ✅ DELETE /api/profile (success, then GET returns null). All validation rules working correctly, no MongoDB ObjectID leakage detected."

  - task: "AI Soul Synthesis - POST/GET /api/synthesis (Claude Sonnet via emergentintegrations, cached per profile)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "POST /api/synthesis generates a 550-800 word narrative from all 20 computed readings (server-side, from stored profile) using EMERGENT_LLM_KEY + anthropic/claude-sonnet-4-6. Caches in 'narratives' collection keyed by userId+profileKey; body {regenerate:true} forces new generation. GET /api/synthesis returns cached narrative or null. Verified manually: 201 generation (769 words, ~27s), cached:true on repeat POST (32ms), GET returns narrative, 401 without token. Frontend card verified via screenshot."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing completed - ALL 6 synthesis tests PASSED: ✅ Login as luna@zaura.app (200), ✅ GET /api/synthesis without token (401), ✅ POST /api/synthesis without token (401), ✅ GET /api/synthesis with token (200) returns cached narrative with all required fields (id UUID, userId UUID, profileKey, text 4455 chars, model, createdAt), no _id leakage, ✅ POST /api/synthesis cached (200) returns cached:true instantly (0.126s < 2s) with same text, ✅ POST /api/synthesis without profile (404) returns correct error message. No LLM generation triggered (used existing cached narrative). All validation, authentication, and caching working correctly."

frontend:
  - task: "Auth view (login/register tabs, glass card, nebula background)"
    implemented: true
    working: true
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Verified via screenshot: login works, redirects to birth form for user without profile."

  - task: "Birth info form with built-in city geocoding (datalist of 48 cities)"
    implemented: true
    working: true
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Verified via screenshot automation: submitted name/date/time/city, profile saved, dashboard shown."

  - task: "Dashboard - flip card, quick stats, category filters, 20-modality grid"
    implemented: true
    working: true
    file: "app/page.js + lib/zaura.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Verified via screenshot: all 20 modality cards render with icons/headlines/summaries; flip card shows cosmic signature."

  - task: "Detail view - sidebar navigation, section cards, prev/next controls"
    implemented: true
    working: true
    file: "app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Verified via screenshot: Western Astrology detail renders with sections + sidebar list of all modalities."

  - task: "Keepsake PDF export (jsPDF client-side: cover + soul story + all 20 readings)"
    implemented: true
    working: true
    file: "lib/pdf.js + app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Dashboard button fetches cached narrative then generates dark multi-page A4 PDF (cover with cosmic signature, soul story, all 20 readings). Verified via Playwright download: Zaura-Cosmic-Profile-Luna.pdf, 248KB. Text sanitized to Latin-1 for jsPDF fonts."

  - task: "Compatibility Reading view (deterministic 6-system synastry, client-side)"
    implemented: true
    working: true
    file: "lib/zaura.js (computeCompatibility) + app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "New 'compat' view: partner form -> report with score ring, verdict tier, 6 weighted aspect cards (Sun synastry, Chinese harmony incl. trines/clashes/secret friends, Life Path, Totem clans, Lunar phase, Vedic rashi). Verified via Playwright: Luna x River = 74 'A Growth Alliance'. Also fixed GlassCard to forward data-testid props."

  - task: "Saved Partners API - GET/POST /api/partners, DELETE /api/partners/:id (dedupe upsert by name+date)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "POST validates partnerName/birthDate/birthTime/overall(0-100), upserts by userId+nameKey+birthDate (201 new, 200 update). GET lists user's partners sorted desc, limit 50, no _id. DELETE partners/:id scoped to user, 404 if missing. Verified via UI automation: save, persist across navigation, reopen. Luna has 2 saved partners (River Sage, Orion Vale)."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing completed - ALL 17 Saved Partners API tests PASSED: ✅ Register throwaway user (201), ✅ GET /api/partners without token (401), ✅ GET /api/partners empty list (200), ✅ POST /api/partners without token (401), ✅ POST /api/partners first time (201) with UUID id and no _id, ✅ POST /api/partners upsert (200) same ID with updated overall, ✅ Validation tests (missing partnerName 400, bad date format 400, bad time format 400, overall > 100 400, overall as string 400), ✅ GET /api/partners contains partner (200), ✅ DELETE /api/partners/:id without token (401), ✅ DELETE /api/partners/:id with token (200), ✅ GET /api/partners after delete (empty), ✅ DELETE same ID again (404), ✅ Isolation test: luna@zaura.app has 2 partners (River Sage, Orion Vale), throwaway user's partner never appeared in her list. All CRUD operations working, all validation rules correct, authentication working, user isolation working, no MongoDB ObjectID leakage."

  - task: "Oracle Chat API - GET/POST/DELETE /api/oracle (multi-turn, session-based, readings as context)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "POST /api/oracle {message}: per-user oracleSessionId, last 12 messages as transcript + 20 readings in system prompt, Claude call, stores both messages in oracle_messages, returns {reply, sessionId} 201. GET returns session history. DELETE clears messages + rotates sessionId. Validation: empty message 400, >1000 chars 400, no profile 404, no token 401. Verified via UI: 2-turn conversation with context carryover (nova@zaura.app has an existing 4-message session)."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing COMPLETE - ALL 25 Oracle Chat tests PASSED: ✅ GET /api/oracle as nova returns 200 with 4 messages (id/role/text/createdAt, no _id), sessionId present, alternating user/assistant roles verified, ✅ GET/POST /api/oracle without token returns 401, ✅ POST validation: empty message 400, >1000 chars 400, ✅ POST without profile returns 404 with correct error message, ✅ POST as luna with valid message returns 201 with reply (role=assistant, non-empty text, sessionId), GET after POST returns 2 messages, ✅ DELETE without token 401, DELETE with token returns ok:true, GET after DELETE returns empty messages. ONE LLM call made as required. All authentication, validation, session management, and message storage working correctly. No MongoDB ObjectID leakage."

  - task: "AI Bond Story API - GET /api/bond-story?partnerId= and POST /api/bond-story (cached per partner)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "POST {partnerId}: computes compatibility server-side, generates 280-420 word story, caches in bond_stories (upsert userId+partnerId), returns cached unless regenerate:true. GET ?partnerId= returns cached or null. 400 no partnerId, 404 unknown partner, 401 no token. DELETE partners/:id also cleans up bond story. Verified via UI: story cached for Luna's partner Orion Vale."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing COMPLETE - ALL 23 Bond Story tests PASSED: ✅ GET /api/bond-story without token 401, without partnerId 400, ✅ GET /api/partners returns 200, found both partners (Orion Vale, River Sage), ✅ GET /api/bond-story for Orion Vale returns 200 with story object (id/partnerId/partnerName/text/model/createdAt, no _id), ✅ GET /api/bond-story for River Sage returns 200 with story:null (no cache), ✅ POST validation: without partnerId 400, nonexistent partnerId 404, without profile 404, ✅ POST for Orion Vale (no regenerate) returns 200 with cached:true instantly (<2s, 0 LLM calls). All authentication, validation, caching, and data structure working correctly. No MongoDB ObjectID leakage. Orion Vale's cached story preserved as required."

  - task: "Photo Readings API - POST /api/photo-reading (palm/handwriting, Claude vision) + GET /api/photo-readings"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "POST {type: palm|handwriting, imageBase64}: validates type (400), base64 presence/min size (400), max size (413); sends image via ImageContent to Claude vision; NOT_VALID guard returns 422 friendly message (not cached); valid reading cached in photo_readings upsert by userId+type, returns 201 (image never stored). GET /api/photo-readings returns cached readings. Verified manually: 400 bad type, 422 non-palm image, 201 palm reading (389 words) for luna. Luna has cached palm reading - do NOT regenerate."
        - working: true
          agent: "main"
          comment: "Added third type 'face' (mian xiang physiognomy prompt, selfie-camera facingMode:user in UI). Verified live: 422 for illustrated face (guard demands real portrait), 201 with 383-word reading for realistic portrait. Luna now also has cached face reading. Face card renders under Physical filter; cached reading + capture panel verified via Playwright."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing COMPLETE - ALL 23 Photo Readings tests PASSED (95 total tests, 0 failures). Verified: ✅ GET /api/photo-readings without token returns 401, ✅ GET /api/photo-readings as luna returns 200 with readings array containing 1 palm reading (id/userId/type/text/model/createdAt, no _id), ✅ POST /api/photo-reading without token returns 401, ✅ POST validation: invalid type 'face' returns 400 with correct error message, missing imageBase64 returns 400, imageBase64 too short (<500 chars) returns 400 with 'empty/corrupted' message, imageBase64 too large (>4M chars) returns 413, ✅ Code review confirmed: vision call exists (line 278 ImageContent), NOT_VALID guard returns 422 (lines 281-283), valid reading cached and returns 201 (lines 284-298). ZERO LLM/vision calls made (strict cost limit adhered). Luna's cached palm reading preserved. All authentication, validation, caching, and data structures working correctly. No MongoDB ObjectID leakage. All backend APIs are production-ready."

  - task: "Timeline API - GET /api/timeline (aggregates user's journey events from all sources)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing COMPLETE - ALL 20 Timeline tests PASSED (111 total tests, 0 failures). Verified: ✅ GET /api/timeline without token returns 401, ✅ GET /api/timeline as luna@zaura.app returns 200 with events array containing exactly 7 events, ✅ All expected event types present: profile, synthesis, photo (palm + face), partner (x2), bondStory, ✅ Each event has required fields (id, type, icon, title, subtitle, date), ✅ No _id leakage in any event, ✅ Events sorted by date descending (verified order), ✅ Register throwaway user (no profile) returns 200 with empty events array. ZERO LLM calls made (used existing cached data). Luna's and Nova's data preserved. Timeline endpoint aggregates user journey correctly from all sources (birth_profiles, narratives, photo_readings, partners, bond_stories, oracle_messages). All authentication, data aggregation, and sorting working correctly. Backend API is production-ready."

  - task: "Friend Invites API - POST /api/invites, GET /api/invite/:code (public), POST /api/invite/:code/accept (mutual bond creation)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "POST /api/invites (auth+profile) creates/reuses persistent 8-hex code. GET /api/invite/:code public returns {inviterFirstName, sunSign, sunGlyph}, 404 unknown. POST /api/invite/:code/accept (auth+profile): rejects own invite (400), computes compatibility, upserts partner docs on BOTH sides (viaInvite:true), records usedBy, returns {partnerId, inviterName}. Verified E2E: luna's code f572fce1 -> sage@zaura.app joined via link, auth banner shown, auto-landed in pre-filled compat (76 Karmic Match), reciprocal bond appeared in luna's list. Do not delete luna/nova/sage data."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing COMPLETE - ALL 51 Friend Invites API tests PASSED (0 failures). Verified: ✅ POST /api/invites as luna returns persistent code 'f572fce1' (idempotent - same code on repeat calls), ✅ POST /api/invites without token returns 401, ✅ POST /api/invites without birth profile returns 404 with correct error message, ✅ GET /api/invite/f572fce1 (no auth) returns 200 with {inviterFirstName:'Luna', sunSign:'Cancer', sunGlyph}, ✅ GET /api/invite/doesnotexist returns 404, ✅ POST /api/invite/f572fce1/accept as luna herself returns 400 'own invite', ✅ POST /api/invite/f572fce1/accept without token returns 401, ✅ POST /api/invite/f572fce1/accept without profile returns 404, ✅ Full accept flow: registered throwaway user, created birth profile, accepted invite -> 200 {partnerId (UUID), inviterName:'Luna Rose Winters'}, ✅ Mutual partner creation verified: throwaway's partners contains Luna Rose Winters with viaInvite:true and overall score 0-100, luna's partners contains throwaway with viaInvite:true, ✅ Repeat accept (idempotency): no duplicate partner entries created (upsert working correctly), ✅ Cleanup successful: deleted throwaway from luna's partners, luna's list restored to 3 partners (Sage Moon, Orion Vale, River Sage), ✅ POST /api/invite/nonexistent/accept returns 404. ZERO LLM calls made. All authentication, validation, mutual bond creation, idempotency, and data structures working correctly. No MongoDB ObjectID leakage. Friend Invites API is production-ready."

  - task: "Bond Notifications API - GET /api/notifications, PATCH /api/notifications/:id/read, DELETE /api/notifications/:id (created server-side on invite accept)"
    implemented: true
    working: true
    file: "app/api/[[...path]]/route.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "When a friend accepts an invite, server creates a notification for the inviter: {id, userId (inviter), kind:'bond_joined', joinerId, inviteCode, partnerId (inviter-side reciprocal bond), friendFirstName, friendFullName, overall, verdict, readAt:null, createdAt}. Idempotent on {userId, kind, joinerId, inviteCode} so repeat accepts do NOT duplicate. GET /api/notifications returns unread first then most-recent, includes unreadCount. PATCH /api/notifications/:id/read sets readAt. DELETE /api/notifications/:id removes. PATCH /api/notifications marks ALL read. Verified via curl: 401 without token, 404 on unknown id, PATCH marks readAt, DELETE returns ok, GET after cleanup returns 0. New CORS methods include PATCH. Luna's canonical 3 partners preserved. Test user luna@zaura.app currently has 0 notifications after cleanup."
        - working: true
          agent: "testing"
          comment: "Comprehensive backend testing COMPLETE - ALL 15 Bond Notifications API tests PASSED (177 total tests, 0 failures). Verified: ✅ GET /api/notifications without token returns 401, ✅ Login as luna@zaura.app (200), ✅ GET /api/notifications as luna returns 200 with empty notifications array and unreadCount=0, ✅ Register throwaway user + create birth profile (201), ✅ As throwaway, POST /api/invite/f572fce1/accept returns 200 with partnerId and inviterName, ✅ GET /api/notifications as luna returns 200 with exactly 1 bond_joined notification containing all required fields (id UUID, userId, kind='bond_joined', joinerId, inviteCode='f572fce1', partnerId UUID, friendFirstName='Notif', friendFullName='Notif Test', overall=64 (0-100), verdict='Opposites in Orbit', readAt=null, createdAt ISO timestamp), no _id leakage, unreadCount=1, ✅ Repeat accept idempotent (still exactly 1 notification, no duplicate), ✅ PATCH /api/notifications/:id/read returns 200 {ok:true}, GET shows readAt set and unreadCount=0, ✅ PATCH /api/notifications/nonexistent/read returns 404, ✅ PATCH without token returns 401, ✅ DELETE /api/notifications/:id returns 200 {ok:true}, GET shows empty list, repeat DELETE returns 404, ✅ DELETE without token returns 401, ✅ Trigger another notification (accept again after delete), PATCH /api/notifications (no id) marks ALL as read, GET shows all readAt set and unreadCount=0, ✅ User isolation: throwaway user GET /api/notifications returns 200 with empty array (joiner has no notifications, only inviter does), ✅ Cleanup successful: deleted throwaway partner, deleted all notifications, luna restored to 3 canonical partners (Sage Moon, Orion Vale, River Sage) and 0 notifications. ZERO LLM calls made (strict cost limit adhered). All authentication, validation, idempotency, user isolation, and data structures working correctly. No MongoDB ObjectID leakage. Bond Notifications API is production-ready."

  - task: "Moon Calendar - getMoonPhase() + getMonthMoonCalendar() in lib/zaura.js, MoonCalendarView component"
    implemented: true
    working: true
    file: "lib/zaura.js + app/page.js"
    stuck_count: 0
    priority: "high"
    needs_retesting: false
    status_history:
        - working: true
          agent: "main"
          comment: "Client-side moon calendar: lib/zaura.js exports getMoonPhase(date) (phase index 0-7, name, glyph, illumination, isKeyPhase), isPowerDay(profile, date) and getMonthMoonCalendar(profile, year, month) which builds a 42-cell 6x7 grid with padding to prev/next month. Each cell contains {day, dateISO, moon, personalDay, themeName, themeText, isPower, powerReason, isToday, inMonth}. Power day = personal day in {1,8,lifePathSingle} OR New/Full Moon. New MoonCalendarView component in page.js renders full month grid with prev/next arrows, Today button, weekday header, moon glyphs, personal-day number, amber ring on today, fuchsia ring on power days, meta line with New/Full moon dates, and click-to-open detail card. Dashboard has new indigo 'Moon Calendar' button. Verified via Playwright: August 2026 renders with 12 power days, today (26) has amber ring, power days have fuchsia ring, detail popover opens on cell click."

metadata:
  created_by: "main_agent"
  version: "1.0"
  test_sequence: 12
  run_ui: false

test_plan:
  current_focus: []
  stuck_tasks: []
  test_all: false
  test_priority: "high_first"

agent_communication:
    - agent: "main"
      message: "MVP built in one pass. Backend needs full testing: auth flows (register duplicate email 409, bad password 401, weak password 400, invalid email 400), token-protected routes (401 without token), profile validation (missing name, bad date format, out-of-range date, bad time format), profile upsert idempotency, GET /api/profile, DELETE /api/profile. Test user exists: luna@zaura.app / cosmic123. All IDs are UUIDs, no ObjectID exposure. Frontend verified visually via screenshots; do NOT run frontend testing without user permission."
    - agent: "testing"
      message: "Backend testing COMPLETE - ALL 22 tests PASSED (10 auth + 12 profile). Created comprehensive test suite in /app/backend_test.py. Verified: all endpoints return correct status codes, all validation rules working, authentication/authorization correct, profile upsert idempotent (same ID on update), no MongoDB ObjectID leakage, all IDs are UUIDs, token invalidation after logout working. Backend is production-ready. Ready for main agent to summarize and finish."
    - agent: "main"
      message: "Added AI Soul Synthesis endpoint testing to test plan. Test user luna@zaura.app has saved birth profile AND already-cached narrative. COST CONSTRAINT: Limit to AT MOST ONE real LLM generation (only if unavoidable). Do NOT send regenerate:true. Test: login, GET/POST synthesis with/without token, POST without profile (404), verify cached response is instant (<2s), check UUID format and no _id leakage."
    - agent: "testing"
      message: "AI Soul Synthesis backend testing COMPLETE - ALL 6 synthesis tests PASSED (28 total tests, 0 failures). Verified: ✅ Authentication (401 without token for both GET and POST), ✅ GET /api/synthesis returns cached narrative with all required fields (id, userId, profileKey, text, model, createdAt) as UUIDs, ✅ POST /api/synthesis returns cached:true instantly (0.126s < 2s) with same text, ✅ POST without profile returns 404 with correct error message, ✅ No MongoDB ObjectID leakage detected, ✅ No LLM generation triggered (used existing cached narrative). All backend APIs are production-ready. Ready for main agent to summarize and finish."
    - agent: "main"
      message: "Added Saved Partners API testing to test plan. Test user luna@zaura.app has 2 saved partners (River Sage, Orion Vale) - DO NOT DELETE. Use NEW throwaway registered user for all create/delete tests. Do NOT call POST /api/synthesis with regenerate. Test: register throwaway user, GET/POST/DELETE /api/partners with/without token, validation (missing partnerName, bad date/time format, overall range/type), upsert logic (same name+date = update with same ID), isolation (throwaway partner never appears in luna's list)."
    - agent: "testing"
      message: "Saved Partners API backend testing COMPLETE - ALL 17 partners tests PASSED (45 total tests, 0 failures). Verified: ✅ Register throwaway user (201), ✅ GET /api/partners without token (401), ✅ GET /api/partners empty list (200), ✅ POST /api/partners without token (401), ✅ POST /api/partners first time (201) with UUID id and no _id, ✅ POST /api/partners upsert (200) same ID with updated overall, ✅ All validation rules working (missing partnerName 400, bad date format 400, bad time format 400, overall > 100 400, overall as string 400), ✅ GET /api/partners contains partner (200), ✅ DELETE /api/partners/:id without token (401), ✅ DELETE /api/partners/:id with token (200), ✅ GET /api/partners after delete (empty), ✅ DELETE same ID again (404), ✅ Isolation test: luna@zaura.app has 2 partners (River Sage, Orion Vale), throwaway user's partner never appeared in her list. All CRUD operations working correctly, all validation rules correct, authentication working, user isolation working, no MongoDB ObjectID leakage. All backend APIs are production-ready. Ready for main agent to summarize and finish."
    - agent: "main"
      message: "Added Oracle Chat API and AI Bond Story API testing to test plan. STRICT LLM COST LIMITS: at most ONE real LLM generation total. NEVER pass regenerate:true. Do NOT POST /api/synthesis. Test users: luna@zaura.app (profile + 2 saved partners: River Sage & Orion Vale; Orion Vale has CACHED bond story - do not delete), nova@zaura.app (profile + existing oracle session with 4 messages - do NOT call DELETE /api/oracle for nova, do NOT send new oracle messages as nova). Test: Oracle Chat (GET as nova, GET/POST without token, POST validation, POST without profile, ONE LLM call as luna, DELETE), Bond Story (GET validation, GET for Orion cached, GET for River null, POST validation, POST for Orion cached instant)."
    - agent: "testing"
      message: "Oracle Chat & Bond Story API backend testing COMPLETE - ALL 48 tests PASSED (93 total tests, 0 failures). Oracle Chat (25 tests): ✅ GET /api/oracle as nova returns 200 with 4 messages (id/role/text/createdAt, no _id), sessionId present, alternating user/assistant roles verified, ✅ GET/POST without token 401, ✅ POST validation (empty message 400, >1000 chars 400), ✅ POST without profile 404, ✅ POST as luna returns 201 with reply (role=assistant, non-empty text, sessionId), GET after POST returns 2 messages, ✅ DELETE without token 401, DELETE with token ok:true, GET after DELETE empty. Bond Story (23 tests): ✅ GET without token 401, without partnerId 400, ✅ GET /api/partners returns 200 with both partners (Orion Vale, River Sage), ✅ GET for Orion Vale returns 200 with story (id/partnerId/partnerName/text/model/createdAt, no _id), ✅ GET for River Sage returns 200 with story:null, ✅ POST validation (without partnerId 400, nonexistent partnerId 404, without profile 404), ✅ POST for Orion Vale (no regenerate) returns 200 with cached:true instantly (<2s). ONE LLM call made as required. All authentication, validation, session management, caching, and data structures working correctly. No MongoDB ObjectID leakage. Orion Vale's cached story preserved. All backend APIs are production-ready. Ready for main agent to summarize and finish."
    - agent: "testing"
      message: "Photo Readings API backend testing COMPLETE - ALL 23 Photo Readings tests PASSED (95 total tests, 0 failures). Verified: ✅ GET /api/photo-readings without token returns 401, ✅ GET /api/photo-readings as luna returns 200 with readings array containing 1 palm reading (id/userId/type/text/model/createdAt, no _id), ✅ POST /api/photo-reading without token returns 401, ✅ POST validation: invalid type 'face' returns 400 with correct error message, missing imageBase64 returns 400, imageBase64 too short (<500 chars) returns 400 with 'empty/corrupted' message, imageBase64 too large (>4M chars) returns 413, ✅ Code review confirmed: vision call exists (line 278 ImageContent), NOT_VALID guard returns 422 (lines 281-283), valid reading cached and returns 201 (lines 284-298). ZERO LLM/vision calls made (strict cost limit adhered). Luna's cached palm reading preserved. All authentication, validation, caching, and data structures working correctly. No MongoDB ObjectID leakage. All backend APIs are production-ready. Ready for main agent to summarize and finish."
    - agent: "testing"
      message: "Timeline API backend testing COMPLETE - ALL 20 Timeline tests PASSED (111 total tests, 0 failures). Verified: ✅ GET /api/timeline without token returns 401, ✅ GET /api/timeline as luna@zaura.app returns 200 with events array containing exactly 7 events, ✅ All expected event types present: profile, synthesis, photo (palm + face), partner (x2), bondStory, ✅ Each event has required fields (id, type, icon, title, subtitle, date), ✅ No _id leakage in any event, ✅ Events sorted by date descending (verified order), ✅ Register throwaway user (no profile) returns 200 with empty events array. ZERO LLM calls made (used existing cached data). Luna's and Nova's data preserved. Timeline endpoint aggregates user journey correctly from all sources (birth_profiles, narratives, photo_readings, partners, bond_stories, oracle_messages). All authentication, data aggregation, and sorting working correctly. Backend API is production-ready."
    - agent: "testing"
      message: "Friend Invites API backend testing COMPLETE - ALL 51 tests PASSED (162 total tests, 0 failures). Verified: ✅ POST /api/invites as luna returns persistent code 'f572fce1' (idempotent), ✅ POST /api/invites without token returns 401, ✅ POST /api/invites without profile returns 404, ✅ GET /api/invite/f572fce1 (no auth) returns 200 with inviter info (Luna, Cancer, sunGlyph), ✅ GET /api/invite/doesnotexist returns 404, ✅ POST /api/invite/f572fce1/accept as luna returns 400 'own invite', ✅ POST /api/invite/f572fce1/accept without token returns 401, ✅ POST /api/invite/f572fce1/accept without profile returns 404, ✅ Full accept flow with throwaway user successful (register, create profile, accept invite -> 200 with partnerId and inviterName), ✅ Mutual partner creation verified (both sides have each other with viaInvite:true), ✅ Repeat accept idempotent (no duplicate partners), ✅ Cleanup successful (deleted throwaway from luna's partners, restored to 3 original partners), ✅ POST /api/invite/nonexistent/accept returns 404. ZERO LLM calls made. All authentication, validation, mutual bond creation, idempotency working correctly. No MongoDB ObjectID leakage. Friend Invites API is production-ready. All backend APIs fully tested and working."
    - agent: "main"
      message: "New feature added: Bond Notifications + Moon Calendar. Bond Notifications: server-side notifications collection with idempotency key {userId, kind, joinerId, inviteCode} created inside invite-accept handler. Endpoints: GET /api/notifications (unread first, unreadCount), PATCH /api/notifications/:id/read (mark read via body {read:true} or path suffix /read), PATCH /api/notifications (mark ALL read), DELETE /api/notifications/:id. New PATCH handler added to route.js and CORS updated to include PATCH. Verified via curl: 401 without token, 200 with token, PATCH sets readAt, DELETE 200/404, idempotency (same joiner via same invite does not create duplicate notification). Test user luna@zaura.app currently has 0 notifications (cleaned after screenshot verification). Data preserved: luna has 3 partners (Sage Moon, Orion Vale, River Sage), nova has oracle history, sage remains as invited friend. STRICT COST LIMIT: no LLM calls needed for notification testing. Please test: (1) GET /api/notifications 401 without token, (2) GET returns 200 with empty notifications list for luna, (3) Register throwaway user + create profile + accept luna's invite (code f572fce1), (4) GET /api/notifications as luna returns 1 unread bond_joined notification with correct fields (id UUID, userId, kind='bond_joined', joinerId, inviteCode='f572fce1', partnerId UUID, friendFirstName, friendFullName, overall 0-100, verdict string, readAt=null, createdAt), (5) Repeat accept as same throwaway - no duplicate notification, (6) PATCH /api/notifications/:id/read returns ok, GET shows readAt set + unreadCount decremented, (7) PATCH /api/notifications (no id) marks ALL as read, (8) DELETE /api/notifications/:id returns 200, 404 on repeat, 401 without token, (9) User isolation: throwaway user's notifications never appear in luna's list. Cleanup: after tests delete throwaway user + luna's throwaway partner + luna's remaining notifications so luna returns to canonical 3 partners + 0 notifications. Moon Calendar is pure client-side (no backend test needed)."
    - agent: "testing"
      message: "Bond Notifications API backend testing COMPLETE - ALL 15 tests PASSED (177 total tests, 0 failures). Verified: ✅ GET /api/notifications without token returns 401, ✅ Login as luna@zaura.app (200), ✅ GET /api/notifications as luna returns 200 with empty notifications array and unreadCount=0, ✅ Register throwaway user + create birth profile (201), ✅ As throwaway, POST /api/invite/f572fce1/accept returns 200 with partnerId and inviterName, ✅ GET /api/notifications as luna returns 200 with exactly 1 bond_joined notification containing all required fields (id UUID, userId, kind='bond_joined', joinerId, inviteCode='f572fce1', partnerId UUID, friendFirstName='Notif', friendFullName='Notif Test', overall=64 (0-100), verdict='Opposites in Orbit', readAt=null, createdAt ISO timestamp), no _id leakage, unreadCount=1, ✅ Repeat accept idempotent (still exactly 1 notification, no duplicate), ✅ PATCH /api/notifications/:id/read returns 200 {ok:true}, GET shows readAt set and unreadCount=0, ✅ PATCH /api/notifications/nonexistent/read returns 404, ✅ PATCH without token returns 401, ✅ DELETE /api/notifications/:id returns 200 {ok:true}, GET shows empty list, repeat DELETE returns 404, ✅ DELETE without token returns 401, ✅ Trigger another notification (accept again after delete), PATCH /api/notifications (no id) marks ALL as read, GET shows all readAt set and unreadCount=0, ✅ User isolation: throwaway user GET /api/notifications returns 200 with empty array (joiner has no notifications, only inviter does), ✅ Cleanup successful: deleted throwaway partner, deleted all notifications, luna restored to 3 canonical partners (Sage Moon, Orion Vale, River Sage) and 0 notifications. ZERO LLM calls made (strict cost limit adhered). All authentication, validation, idempotency, user isolation, and data structures working correctly. No MongoDB ObjectID leakage. Bond Notifications API is production-ready. All backend APIs fully tested and working."
