---
inclusion: fileMatch
fileMatchPattern: "server/**"
---

# Location, visibility and check-in rules (server)

## Distance
Use the Haversine formula in `utils/haversine.ts`, in metres. Inputs are raw `lat`, `lng` from the request. Unit-tested against known distances.

## Accuracy
Always store `accuracy` and `distance` on the check-in. The creator UI flags records with `accuracy > 50` as **Low accuracy** (`lowAccuracy: true` in the record DTO).

## Visibility (`POST /sessions/nearby` and `GET /sessions/:id`)
`nearby` uses:
```ts
Session.aggregate([
  { $geoNear: { near: { type: 'Point', coordinates: [lng, lat] },
      distanceField: 'dist', maxDistance: MAX_RADIUS, spherical: true,
      query: { status: 'Open' } } },
  { $match: { $expr: { $lte: ['$dist', '$radius'] } } },
  // exclude sensitive fields
  { $project: { passcodeHash: 0, allowedEmails: 0 } }
])
```
- `GET /sessions/:id` applies the same distance check. Outside the radius it returns **403 `NOT_AVAILABLE_HERE` with no session fields**.
- Email-restricted sessions **are still shown** in nearby/detail (location is the gate), but check-in is rejected if email not on list.
- **Link verification removed** – `linkToken` exists for share URLs but is not checked during check-in.

## Check-in order (`services/checkIn.service.ts`)
1. session exists and `status === 'Open'`
2. distance <= radius
3. verification:
   - `passcode`: bcrypt compare against `passcodeHash`
   - `email`: `user.verified === true` AND `user.email` in `session.allowedEmails`
   - `location`: no extra check
4. `late = now > startsAt + env.LATE_AFTER_MINUTES` (default 10 min)
5. create `CheckIn`; the unique partial index `{ session, user }` (where `user` exists) rejects duplicates (409 `ALREADY_CHECKED_IN`)
6. set `session.sheetLocked = true` if this is the first check-in
7. (no live event emitted – SSE `/live` polls records on its own)

Each failure returns a distinct error `code` the UI maps to a friendly message.

## Lifecycle
- Statuses: `Open`, `Closed`, `Cancelled`. Closing blocks new check-ins only. A cron job (`scheduler.service.ts`) auto-closes sessions past `endsAt`.
- After the first check-in, reject changes to `location`, `radius`, `verification`, `passcodeHash`, and `allowedEmails` (409 `SESSION_LOCKED`). Title, venue, description, `startsAt`, `endsAt`, and `sheet` stay editable.
- The lock is tracked by `session.sheetLocked` (boolean).
- Creators may add a **manual** record (`manual: true`, no distance or accuracy, name required, email optional) via `POST /sessions/:id/records`.
- Absent list = `allowedEmails` minus checked-in emails (email sessions only). Backend computes it in `GET /sessions/:id/records` response (`summary.absent`). UI does not display it yet.
