# GeoAttend Server

Express + MongoDB (Mongoose) + TypeScript API for GeoAttend. Authentication is **mocked** for now (no Gmail or real login needed).

## Run it

```bash
# 1. If you keep your own package.json, add the new packages:
npm install zod helmet express-rate-limit
npm install -D @types/cors
# (or just use the package.json in this zip and run: npm install)

# 2. Make sure MongoDB is running (local) or put your Atlas URI in .env (MONGODB_URI)

# 3. Start
npm run dev          # http://localhost:5000
npm test             # unit tests (distance, hashing, CSV)
npm run typecheck
npm run build && npm start
```

Needs Node 20.6 or newer.

## Mock auth (temporary)

There is no password or email check. Every `/api/me` and `/api/sessions` request acts as the user in the
`x-mock-user: someone@example.com` header (no header = `alex@example.com`). Unknown emails are created on the fly.
`?as=email` works too, because `EventSource` cannot set headers. Set `MOCK_AUTH=false` to switch mock auth off (those routes then return 501).
All the code that reads the user uses `req.user`, so real auth only has to replace `src/middleware/mockAuth.ts`.

## Response format
Success `{ "ok": true, "data": ... }`. Error `{ "ok": false, "error": { "code", "message", "details?" } }`.
Codes: `VALIDATION UNAUTHENTICATED FORBIDDEN NOT_FOUND NOT_IMPLEMENTED GPS_TOO_WEAK NOT_AVAILABLE_HERE SESSION_CLOSED OUTSIDE_TIME_WINDOW SESSION_LOCKED WRONG_PASSCODE EMAIL_NOT_ALLOWED LINK_REQUIRED ALREADY_CHECKED_IN RATE_LIMITED CONFLICT INTERNAL`.

## APIs that are built (real logic, saved in MongoDB)

| Method | Path | What it does |
|---|---|---|
| GET | `/api/health` | Server status |
| POST | `/api/sessions/nearby` | Body `{lat,lng,accuracy}`. Returns only sessions the user is **inside the radius** of (Open, inside the time window, email list respected) |
| GET | `/api/sessions/:id?lat&lng&accuracy&t` | One session for a participant. Outside the radius: 403 `NOT_AVAILABLE_HERE` with no details. `t` is the link token |
| POST | `/api/sessions/:id/check-in` | Body `{lat,lng,accuracy,passcode?,token?}`. Runs the full rule order, flags Late, blocks duplicates |
| GET | `/api/me/history` | The user's check-ins and attended count |
| POST | `/api/sessions` | Create (category, title, venue, times, lat/lng, radius, verification, passcode?, allowedEmails?). A generated passcode is returned once |
| GET | `/api/sessions/mine?status=` | Creator's sessions with check-in counts |
| GET | `/api/sessions/mine/:id` | One of my sessions (includes share link and sheet settings) |
| PATCH | `/api/sessions/:id` | Edit. Location, radius, verification, passcode and emails lock after the first check-in |
| POST | `/api/sessions/:id/open` `/close` `/cancel` | Change status |
| POST | `/api/sessions/:id/duplicate` | Copy a session (new link, new passcode) |
| POST | `/api/sessions/:id/passcode` | Generate a new passcode (before any check-in) |
| PUT | `/api/sessions/:id/sheet` | Save printable sheet design settings |
| DELETE | `/api/sessions/:id` | Delete a session and its records |
| GET | `/api/sessions/:id/records` | Records + summary (count, expected, absent list for email sessions) |
| POST | `/api/sessions/:id/records` | Manual attendee `{name, email?}` |
| DELETE | `/api/sessions/:id/records/:recordId` | Remove a record |
| GET | `/api/sessions/:id/export.csv` | CSV download (formula-safe) |
| GET | `/api/sessions/:id/live` | Live check-ins via Server-Sent Events (events `checkin`, `removed`, `status`) |
| GET | `/api/me` | My profile |
| PATCH | `/api/me` | Update name and notification preferences |
| DELETE | `/api/me` | Delete my account, sessions and records |

## APIs that are mocked (return fake data, no password or email)

| Method | Path | Mock behavior |
|---|---|---|
| POST | `/api/auth/register` | Creates an unverified user, returns `token: "mock-<email>"` and `verificationToken` |
| POST | `/api/auth/login` | Finds the user by email only, returns `token: "mock-<email>"` |
| POST | `/api/auth/logout` | 204, does nothing |
| GET | `/api/auth/verify/:token` | Marks the user verified (token `verify-<email>`) |
| POST | `/api/auth/forgot` | Always `{sent:true}` |
| POST | `/api/auth/reset` | Always `{updated:true}` |

## NOT built yet

- Real authentication: password hashing, JWT httpOnly cookies, sending verification and reset emails, change password (`POST /api/me/password`), token expiry, refresh.
- Notifications and reminders (the preference flags are saved, nothing is sent).
- Server-side PDF of the printable sheet (the client prints it; the server stores the design and serves records).
- Pagination and search for sessions, records and history.
- Integration tests that run against MongoDB.
- Shared rate-limit store (Redis) for running several servers, and production logging.
- Deployment files (Dockerfile, CI).
- Client-only items: maps (Leaflet), QR code image, React UI.

## Decisions you can change
- **Link sessions are not listed** in `/sessions/nearby` (reachable only with the link token). Set `LINK_SESSIONS_IN_LIST=true` to list them.
- **Passcodes are stored hashed**, so the creator only sees a passcode once, at creation or when regenerated.
- **Time window:** check-in opens `EARLY_CHECKIN_MINUTES` (15) before the start and closes at the end. Late = more than `LATE_AFTER_MINUTES` (10) after the start.
- **GPS accuracy** over `MAX_GPS_ACCURACY` (100 m) is rejected. Records over 50 m are flagged `lowAccuracy`.
- CORS allows only `CLIENT_URL`.

## Layout
```
src/
  config/env.ts            validated environment
  models/                  User, Session (2dsphere index), CheckIn (unique per user+session)
  middleware/              mockAuth, validate (zod), rateLimit, errorHandler
  routes/ controllers/     thin HTTP layer
  services/                business rules: checkIn, nearby, session, record, me, live (SSE)
  utils/                   haversine, hash (scrypt), tokens, csv (+ unit tests)
  scripts/                 migration scripts
requests.http              sample requests (VS Code REST Client)
```
