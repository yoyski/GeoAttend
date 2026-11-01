---
inclusion: fileMatch
fileMatchPattern: "client/**"
---

# Design system (current implementation)

**Note:** The app no longer follows the "field survey" prototype theme. The current design is **"Graphite"** – near-monochrome with electric blue signal.

## Look: "Graphite"
Near-monochrome, electric blue signal (`--sig`), Tailwind CSS + Radix UI primitives.

### Color tokens (CSS variables in `index.css`)
**Light mode:**
- `--bg: #F4F4F2` (background)
- `--card: #FFFFFF` (card background)
- `--ink: #111111` (primary text)
- `--mut: #666666` (muted text)
- `--line: #DADAD6` (borders)
- `--pine: #1F1F1F` (primary action/button bg)
- `--onp: #FFFFFF` (text on primary)
- `--tint: #EAEAE6` (tinted background)
- `--sig: #2F5BFF` (accent/signal blue)
- `--sigt: #DFE6FF` (signal tint)
- `--err: #C62828` (error red)
- `--errt: #F8DCDC` (error tint)
- `--map: #E9E9E5` (map background)

**Dark mode** (via `prefers-color-scheme: dark` or `[data-theme="dark"]`):
- `--bg: #0E0E0F`, `--card: #17171A`, `--ink: #F2F2F0`, `--mut: #9A9A9A`, `--line: #2A2A2E`, `--pine: #E8E8E8`, `--onp: #0E0E0F`, `--tint: #202024`, `--sig: #7C98FF`, `--sigt: #1B2340`, `--err: #F28A74`, `--errt: #3B1F19`, `--map: #19191C`.

Users can override with `data-theme="light"|"dark"` on root.

### Fonts
- **Fraunces** (serif, 600 weight) for headings (`h1`–`h6`).
- **Manrope** (sans-serif) for body text.
- System monospace for labels, status tags, and nav (uppercase, small).

Google Fonts links in `index.html`.

## Components and layout
- **Tailwind CSS** + **Radix UI** primitives (Dialog, Select, Label, Separator, Slot).
- **lucide-react** icons (not Tabler icons as originally planned).
- Buttons use Tailwind classes referencing CSS variables (`bg-[var(--pine)]`, `text-[var(--onp)]`).
- Status chips are small uppercase tags with colored dots.
- Inputs use Radix `Label` + styled `Input` components.
- **No ledger rows yet** – sessions render as simple card-like divs or list items.
- **Navigation:** bottom bar on mobile (Attend, Create, My sessions, Account) via `Layout.tsx`. Left rail not yet implemented for desktop.
- **Breakpoints:** Tailwind defaults (sm: 640, md: 768, lg: 1024, xl: 1280). Custom breakpoints (720, 900, 1180) not yet configured.

## Map
`react-leaflet` with OpenStreetMap tiles. Draggable pin via Leaflet marker, dashed circle for radius (manual draw, not a drag handle yet). Zoom buttons, "Use my location" button. Live coordinates shown below map. Keyboard nudging and radius shortcuts not yet implemented.

## Printable sheet
`SheetPage.tsx` exists with a basic editor (title, footer, row count, column toggles). Live preview and full print CSS not yet complete. QR code, custom columns, signatures, color themes, and logo upload are placeholders or incomplete.

## Accessibility
- Visible focus rings on controls (Tailwind `focus:ring`).
- Labels on all inputs (Radix `Label` component).
- Icon buttons should have `aria-label` (partially implemented).
- Color is not the only signal (status text + color).
- `prefers-reduced-motion` not yet explicitly handled in animations.
- Touch targets: Tailwind defaults, 44px not enforced everywhere yet.
- Errors announced with `role="alert"` (partially implemented).
