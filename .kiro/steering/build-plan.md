---
inclusion: manual
---

# Build plan (use with `#build-plan` when creating specs)

**Note:** This build plan is from the original design. The app has evolved beyond it. Use this only as a rough historical reference. Current features and implementation details are in the other steering files.

Create one Kiro spec per milestone, in this order. Each spec needs requirements, design and tasks, and ends with passing tests.

## Milestones (original plan)
1. **Foundation:** monorepo, server skeleton (TypeScript), Mongo connection, error middleware, lint and test setup. ✅ **Done** (server is TypeScript, client is TypeScript + Vite, Mongoose + Express setup complete).
2. **Auth:** register, email verification, login/logout (cookie), forgot/reset, `/me`, account screen, log out and delete account. ✅ **Mostly done** (register, login, logout, `/me`, account page exist; email sending not wired, forgot/reset backend ready but no UI).
3. **Sessions (creator):** create with map pin and radius, verification type tiles, edit, publish, open/close/cancel/delete/duplicate, My sessions with filters. ✅ **Done** (create, list, edit, status changes, duplicate, delete all implemented; no explicit "publish" step, sessions start `Open`).
4. **Nearby and check-in (location only):** `/sessions/nearby`, `GET /sessions/:id`, `useLocation` hook, permission and outside states, check-in, history and attendance rate. ✅ **Done** (nearby, detail, check-in, history all working; location hook exists).
5. **Other verifications:** passcode (generate/replace), email list, shared link and QR. ⚠️ **Partial** (passcode works, email list works, link verification removed from check-in flow but `linkToken` still exists for share URLs).
6. **Creator dashboard:** records, flags, manual add, absent list, CSV export, Socket.IO live updates. ⚠️ **Partial** (records, flags, manual add, CSV export done; no Socket.IO, uses SSE `/live` instead; absent list computed but not shown in UI).
7. **Printable sheet:** editor, live preview, print CSS, QR, real records. ⚠️ **In progress** (sheet editor exists, preview and print CSS incomplete, QR and custom columns placeholders).
8. **Hardening:** rate limits, security review, accessibility pass, offline queue, deploy. ⚠️ **Partial** (rate limits on check-in and nearby, helmet + cors configured; no offline queue, no full accessibility audit, not deployed yet).

## Current status summary
Core functionality is complete: auth, sessions, check-in, records, live view. Missing: email sending, full sheet printing, offline queue, full testing, production deployment.

Definition of done for every milestone: tests pass, lint clean, no TODOs, steering rules respected, UI matches the design system (Graphite theme, not the original field survey prototype).
