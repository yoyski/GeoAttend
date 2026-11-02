# GeoAttend Client

React 18 + Vite + TypeScript + Tailwind with Shadcn/ui components.

## 🎨 Design System

**GeoAttend uses Shadcn/ui styled with a "field survey" aesthetic:**
- Fraunces serif + Manrope sans + system mono
- Ruled sections (2px ink borders), underlined inputs
- Pine brand color, signal accent, dark mode support
- See `SHADCN-UI.md` for the complete integration guide

## Run
```bash
npm install            # adds react-router-dom and typescript to your existing setup
npm run dev            # http://localhost:3000 (Vite proxies /api to http://localhost:5000)
npm run typecheck
npm run build
```
Start the server first (`npm run dev` in the server folder). In the **server** `.env` set
`CLIENT_URL=http://localhost:3000` so share links point at this client.

## How to test
1. **Account page**: Create a new account or log in with Google OAuth.
2. **Attend page**: Use the yellow box as a *test location*. Enter lat/lng/accuracy coordinates,
   hit **"Sessions here"** to list sessions within radius. **"Far away"** shows the empty state.
   Switch to **Real GPS** to use your browser location (needs localhost or HTTPS).
3. **Open a session** and check in. Try different scenarios: high accuracy values, wrong passcode,
   checking in twice to test validation.
4. **Create / My sessions / Manage**: Create sessions with each verification type, edit sessions (note: some fields lock after the first check-in),
   open/close/cancel/duplicate/delete, add a manual attendee, see the absent list (email sessions), download CSV,
   watch records arrive live while another browser profile checks in.
5. **Printable sheet** (Manage > Printable sheet): edit title/columns/rows, save the design to the server, print.

## Structure (same layering as the server)
```
src/
  api/        client.ts (axios + ApiError), endpoints.ts (every server route, typed)
  hooks/      useAsync, useAuth, useLocation
  components/ ui/ (Shadcn/ui components), Layout, LeafletMap, SignaturePad
  pages/      Attend, Session, Create, Mine, Manage, Sheet, Account, Auth
  lib/        utils.ts (cn helper for Tailwind)
  types.ts    shapes returned by the server
```

## 📚 Documentation

- **SHADCN-UI.md** - Complete Shadcn/ui integration guide
- **SHADCN-QUICKREF.md** - Quick copy-paste component patterns
- **SETUP-COMPLETE.md** - Technical setup details
- **ShadcnExamples.tsx** - Live component demo

## Built with Shadcn/ui
✅ Map picker with Leaflet + OpenStreetMap
✅ Authentication screens with email verification
✅ QR code generation for share links
✅ Responsive design with dark mode
✅ Printable attendance sheet with live preview
