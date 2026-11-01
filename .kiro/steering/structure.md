---
inclusion: always
---

# GeoAttend: Project Structure

```
geoattend/
├─ .kiro/steering/          steering files (this folder)
├─ client/                  React + TypeScript + Vite
│  └─ src/
│     ├─ api/               client.ts (axios wrapper), endpoints.ts (typed API calls)
│     ├─ components/        Layout, Avatar, LeafletMap, SignaturePad, ThemeToggle, ui/* (Radix + Tailwind)
│     ├─ features/          (currently empty, pages hold feature logic)
│     ├─ hooks/             useAuth, useLocation, useTheme, useAsync
│     ├─ lib/               utils (cn), image, returnTo
│     ├─ pages/             AuthPage, AttendPage, CreatePage, MinePage, ManagePage, SessionPage, SheetPage, AccountPage
│     ├─ types.ts           shared type definitions
│     ├─ index.css          CSS variables + Tailwind imports
│     └─ main.tsx
└─ server/                  Express + TypeScript + Mongoose
   └─ src/
      ├─ config/            env.ts (zod-validated environment)
      ├─ models/            User.ts, Session.ts, CheckIn.ts
      ├─ routes/            index.ts, auth.routes.ts, me.routes.ts, sessions.routes.ts
      ├─ controllers/       auth.controller.ts, me.controller.ts, sessions.controller.ts, records.controller.ts
      ├─ services/          checkIn, nearby, session, record, me, live (SSE), scheduler (cron), dto
      ├─ middleware/        auth, validate, rateLimit, errorHandler
      ├─ utils/             asyncHandler, hash, haversine, token, csv
      ├─ schemas.ts         zod validation schemas
      ├─ app.ts             Express app setup
      └─ index.ts           Server entry point
```

## Layering rules
- `routes` -> `controllers` -> `services` -> `models`. Controllers hold no business rules. Services never touch `req`/`res`.
- The check-in order, visibility rule, and edit locking live **only** in `services/`. Do not duplicate them in the client.
- Client pages currently hold feature logic directly (no `features/` folders yet). Shared pieces go in `components/`.

## Naming
- Client: React components `PascalCase.tsx`, hooks `useThing.ts` or `.tsx`, all TypeScript.
- Server: all files `camelCase.ts`, TypeScript.
- Routes are plural nouns: `/sessions`, `/sessions/:id/records`.
- One test file next to the code: `thing.test.ts` (currently only utils have tests).
