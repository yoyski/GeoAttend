---
inclusion: manual
---

# Steering Files Update - Summary of Changes

**Updated:** October 30, 2026

All steering files have been updated to reflect the **actual current state** of the GeoAttend application, based on the codebase as it exists now.

## Major Changes from Original Plan

### Technology Stack (tech.md)
- ✅ **TypeScript** added to both client and server (was plain JavaScript)
- ✅ **Tailwind CSS** + **Radix UI** for styling (not custom CSS)
- ❌ **No TanStack Query** – using plain axios
- ❌ **No Socket.IO** – using Server-Sent Events (SSE) for live updates via `/sessions/:id/live`
- ❌ **No Nodemailer yet** – email sending not wired up
- ❌ **No Prettier** – manual formatting only
- ❌ **Limited tests** – only utils tested with Node's `--test` runner, no Vitest/Jest yet

### Product Features (product.md)
- ❌ **Link verification removed** – `linkToken` exists for share URLs but is **not a verification method**
- ❌ **No email sending** – tokens generated but not sent
- ❌ **No password reset UI** – backend ready, frontend not built
- ❌ **No offline queue** yet
- ❌ **Absent list** computed by backend but not shown in UI
- ⚠️ **Printable sheet** partially implemented – editor exists, print view incomplete

### Design System (design-system.md)
- 🎨 **"Graphite" theme** replaced "field survey" prototype theme
  - Near-monochrome with electric blue signal (`--sig: #2F5BFF` in light, `#7C98FF` in dark)
  - New color palette (lighter grays, blue accent instead of vermilion/pine)
- ✅ **Fraunces** (serif) + **Manrope** (sans) fonts still used
- ❌ **No ledger rows** yet – sessions are simple cards/list items
- ❌ **No left sidebar** on desktop yet – only bottom nav implemented
- ⚠️ **Custom breakpoints** (720, 900, 1180) not configured, using Tailwind defaults

### API Changes (api-and-security.md)
- ✅ Response format: `{ data }` / `{ error: { code, message } }` (no `ok` field)
- ✅ `optionalAuth` middleware added for pre-login location checks
- ✅ Live endpoint: `GET /sessions/:id/live` (SSE, not Socket.IO)
- ✅ Rate limits partially configured (check-in, nearby)
- ✅ New endpoints: `POST /sessions/:id/passcode`, `PUT /sessions/:id/sheet`, `DELETE /sessions/:id/records/:recordId`

### Location Rules (location-and-checkin-rules.md)
- ✅ TypeScript: `haversine.ts` not `.js`
- ✅ Configurable: `env.MAX_GPS_ACCURACY`, `env.LATE_AFTER_MINUTES`, `env.EARLY_CHECKIN_MINUTES`
- ❌ **No link verification check** during check-in
- ✅ **Auto-close cron job** – `scheduler.service.ts` closes expired sessions
- ✅ **Edit locking** tracked by `session.sheetLocked` boolean

### Project Structure (structure.md)
- ✅ All TypeScript (`.ts`, `.tsx` extensions)
- ✅ `features/` folder exists but empty – logic in `pages/` directly
- ✅ Additional services: `live.service.ts`, `scheduler.service.ts`, `dto.ts`
- ✅ `schemas.ts` file with all zod schemas
- ✅ Tests only in `utils/*.test.ts` files

### Build Plan (build-plan.md)
- Updated with current completion status for each milestone
- Marked as historical reference only

### Testing (testing.md)
- Updated to reflect **minimal testing** current state
- Only utils tests (haversine, hash, csv) implemented
- No integration or client tests yet

## Environment Variables Added
Server now uses:
- `MAX_GPS_ACCURACY` (default 100)
- `LATE_AFTER_MINUTES` (default 10)
- `EARLY_CHECKIN_MINUTES` (default 15)
- `LINK_SESSIONS_IN_LIST` (default false)

## What Works Now
✅ Register, login, logout, account management
✅ Create sessions with map, radius, verification types
✅ Nearby sessions (location-gated visibility)
✅ Check-in with location/passcode/email verification
✅ Session management (edit, open/close/cancel, duplicate, delete)
✅ Records view with flags (late, manual, low accuracy)
✅ Manual record add/remove
✅ CSV export with formula escaping
✅ Live updates via SSE
✅ History and attendance count
✅ Theme toggle (light/dark/system)
✅ Scheduler auto-closes expired sessions

## What's Missing/Incomplete
❌ Email sending (verification, reset, notifications)
❌ Password reset UI
❌ Offline queue for check-ins
❌ Full printable sheet (QR, custom columns, signatures, color themes)
❌ Absent list display in UI
❌ Comprehensive testing (integration, client, E2E)
❌ Production deployment
❌ Accessibility audit
❌ Left sidebar navigation on desktop
❌ Ledger-style session rows
❌ Map keyboard shortcuts (arrow keys, +/- for radius)

## Files Updated
1. `tech.md` – Stack, dependencies, conventions
2. `structure.md` – File organization, naming
3. `product.md` – Features, verification types, rules
4. `api-and-security.md` – Endpoints, response format, error codes
5. `location-and-checkin-rules.md` – Distance, visibility, check-in flow
6. `design-system.md` – Graphite theme, components, current state
7. `testing.md` – Current minimal test coverage
8. `build-plan.md` – Milestone completion status

All steering files now accurately reflect what exists in the codebase.
