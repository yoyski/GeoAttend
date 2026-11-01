---
inclusion: always
---

# GeoAttend: Tech Stack and Conventions

## Stack (MERN + TypeScript)
- **MongoDB** Atlas with **Mongoose 8**. Geospatial queries use a `2dsphere` index on `Session.location`.
- **Express** on **Node 20+**, ES modules (`"type": "module"`), **TypeScript** for the server.
- **React 18** with **Vite** and **TypeScript**, React Router 6, react-leaflet (OpenStreetMap tiles), Radix UI primitives, Tailwind CSS.
- **No TanStack Query** – plain axios in `client/src/api/`. **No Socket.IO** – live view uses EventSource (SSE) via `/sessions/:id/live`.
- Auth: `bcrypt`, `jsonwebtoken`, JWT in an **httpOnly, Secure, SameSite=Lax cookie**. Email verification and reset tokens are random, stored hashed (SHA-256), with expiry.
- Validation: `zod` on every request body, query and param (server-side in middleware).
- Security: `helmet`, strict CORS to `CLIENT_URL`, `express-rate-limit` on auth and check-in endpoints.
- **No email provider yet** – registration creates verification tokens but does not send them. Mailer service placeholder exists but is not wired.
- Tests: Node's built-in `--test` runner for server utils (haversine, hash, csv). No client tests yet. No integration tests yet.
- Lint: ESLint. No Prettier config (manual formatting).

## Commands
Server: `npm run dev` (nodemon + tsx), `npm run build` (tsc), `npm start` (node dist/), `npm test` (unit tests only).
Client: `npm run dev` (vite), `npm run build`, `npm run typecheck`.
Root: `npm run dev` runs both client and server concurrently.

## Environment variables (never commit values)
Server `.env`: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `NODE_ENV`, `PORT`, `MAX_GPS_ACCURACY`, `LATE_AFTER_MINUTES`, `EARLY_CHECKIN_MINUTES`, `LINK_SESSIONS_IN_LIST`.
Client: `VITE_API_BASE` (defaults to `http://localhost:5000/api`).

## Conventions
- Server: **TypeScript**. Use `asyncHandler` wrapper; errors flow to central `errorHandler`. Return `{ data }` on success, `{ error: { code, message } }` on failure (no `ok` field).
- Client: **TypeScript**. API client (`api/client.ts`) wraps axios, throws on non-2xx, returns `.data` directly.
- Dates are stored in UTC (ISO). UI converts to local time.
- Geo coordinates are stored GeoJSON order `[lng, lat]`. Frontend passes `{ lat, lng, accuracy }` and server converts to GeoJSON internally.
- Never return `passwordHash`, `passcodeHash`, `verificationToken`, `resetToken`, or `allowedEmails` to participants.
- HTTPS is required in production (browser geolocation needs it).
- No `console.log` in production code (use a proper logger or conditional dev logging).
