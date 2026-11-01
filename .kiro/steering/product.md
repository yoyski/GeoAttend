---
inclusion: always
---

# GeoAttend: Product

GeoAttend is a location-based attendance app. A participant can only see and check in to a session while physically inside the check-in radius the creator set.

## Users
- There is **one account type**. Any user can create sessions (acting as Creator) and check in to other people's sessions (acting as Participant). The role depends on the session, never on the account. There is no `role` field on `User`; ownership is `session.creator`.

## Verification types (the creator picks exactly one per session)
1. `location`: inside the radius is enough. Publishes immediately with no extra setup.
2. `passcode`: inside the radius, then a passcode. The app generates a strong passcode; the creator may replace it (min 6 chars). Store only a hash.
3. `email`: inside the radius, and the participant's **verified account email** is on the creator's list.

**Link verification removed** – every session now generates a `linkToken` (UUID) for share URLs, but it is **not used as a verification method**. The verification types are only `location`, `passcode`, and `email`.

Location is always required and always checked first. The other two are the single extra check.

## Core rules (never break these)
- **Visibility:** sessions are shown to a participant only while they are inside the session radius. Outside, the server returns 403 with no session details (no title, venue, map or radius). The list is empty with a clear message.
- **Server decides:** distance, accuracy, passcode, and email checks all run on the server from raw coordinates. Never trust a client flag such as `isInside`.
- **No duplicates:** one check-in per user per session, enforced by a unique partial index (`session + user`, where `user` exists).
- **Records persist:** closing, cancelling or editing a session never deletes check-in records. Only the creator deleting a session removes them.
- **Own sessions only:** creators can view and change only sessions they own (404 if not the creator).
- **Edit locking:** after the first check-in, radius, location, verification, passcode, and email list are locked (`session.sheetLocked = true`). Title, venue, schedule, and description stay editable.

## Features implemented
**Participant:** register, log in/out, see nearby sessions (inside radius only), view details and map, check in (location/passcode/email), view check-in history with attendance count.
**Creator:** create (title, description, venue, date/time, map pin, radius, verification type), list mine (all/open/closed/cancelled), edit (unlocked fields), open/close/cancel, duplicate, delete, regenerate passcode, view records (with late/manual/lowAccuracy flags), add manual record, remove record, CSV export, sheet settings (printable design), live SSE endpoint for real-time updates.
**Account:** profile (name, avatar, notification preferences), log out, delete account (no password change yet in UI, but backend supports it).

## Not yet implemented
- Email sending (verification, reset, notifications) – tokens are generated but not sent.
- Password reset flow (backend ready, UI not built).
- Forgot password UI.
- Offline queue for check-ins.
- Push notifications (design for them, do not build yet).
- Absent list UI (backend computes it, UI does not show it yet).
- Full printable sheet rendering with custom columns, signatures, QR codes (sheet editor exists, print view incomplete).

## Out of scope for now
Payments, organizations/teams, native mobile apps.

## Glossary
Session = one attendance event. Radius = metres around the venue pin. Check-in = one participant's recorded attendance. Record = a check-in as shown to the creator.
