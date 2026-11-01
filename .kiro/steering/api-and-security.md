---
inclusion: fileMatch
fileMatchPattern: "server/**"
---

# API and security conventions

## Endpoints (all prefixed `/api`)
**Auth:** `POST /auth/register|login|logout|forgot|reset`, `GET /auth/verify/:token`, `POST /me/password`.
**Me:** `GET|PATCH|DELETE /me`, `GET /me/history`.
**Participant:** `POST /sessions/nearby`, `GET /sessions/:id`, `POST /sessions/:id/check-in`.
**Creator:** `POST /sessions`, `GET /sessions/mine`, `GET /sessions/mine/:id`, `PATCH /sessions/:id`, `POST /sessions/:id/(open|close|cancel|duplicate|passcode)`, `PUT /sessions/:id/sheet`, `DELETE /sessions/:id`.
**Records:** `GET /sessions/:id/records`, `POST /sessions/:id/records` (manual add), `DELETE /sessions/:id/records/:recordId`, `GET /sessions/:id/export.csv`.
**Live:** `GET /sessions/:id/live` (SSE, not Socket.IO).

## Rules
- Validate every input with zod in `validate` middleware before any logic. Reject unknown fields.
- Auth middleware (`auth`) loads `req.user` from the JWT cookie. Creator routes also verify `session.creator.equals(req.user._id)`; otherwise 404 (do not reveal existence).
- `optionalAuth` middleware populates `req.user` if present, but does not require it (used for `/sessions/:id` detail view to allow location checks before login).
- Rate limits: login, register, forgot/reset (strict, not yet configured); check-in (5/min per user, 20/min per IP); nearby (10/min per user, 40/min per IP).
- Passwords and passcodes: bcrypt (cost 12). Tokens: 32 random bytes (crypto.randomBytes), store SHA-256 hash, expire verification in 24h and reset in 30min.
- Unverified accounts cannot check in to email-restricted sessions (backend checks `user.verified`).
- Same response for "unknown email" and "wrong password"; forgot-password always returns success.
- CSV export escapes formulas (prefix `=`, `+`, `-`, `@` with `'`).
- Log errors without request id (not yet implemented), never log passwords, tokens or full coordinates.
- **Response format:** success `{ data }`, error `{ error: { code, message } }` (no `ok` field).

## Error codes (stable, used by the UI)
`VALIDATION`, `UNAUTHENTICATED`, `FORBIDDEN`, `NOT_FOUND`, `GPS_TOO_WEAK`, `NOT_AVAILABLE_HERE`, `SESSION_CLOSED`, `SESSION_LOCKED`, `WRONG_PASSCODE`, `EMAIL_NOT_ALLOWED`, `ALREADY_CHECKED_IN`, `RATE_LIMITED`, `CONFLICT`, `INTERNAL_ERROR`.
