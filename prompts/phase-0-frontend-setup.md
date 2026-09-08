# Implementation Prompt — Frontend Phase 0: Project setup

Copy this entire prompt into a new agent chat when you are ready to scaffold the frontend.

---

## Role

You are implementing **Frontend Phase 0 — Project setup** for the Dental Clinic Planner. The NestJS API already exists (or is being built in parallel). Build a real **product frontend** in `dev-ui/` (or create it if missing) — not an API testing console, not Swagger wrappers.

Do not implement login, booking, or other features yet. Do not write automated tests. Do not change the backend.

## Read first (required)

1. [docs/README.md](../docs/README.md) — stack, run commands, MVP goal
2. [docs/architecture.md](../docs/architecture.md) — routing prefix `/api/v1`, error JSON shape, time in UTC
3. [docs/phases/phase-0-project-setup.md](../docs/phases/phase-0-project-setup.md) — what the API exposes at phase 0 (`/health`, Swagger)
4. [prompts/README.md](./README.md) — design defaults for all frontend phases

Treat those docs as source of truth.

## Locked decisions (do not change)

- Frontend lives under `dev-ui/` at the repo root.
- Vite + React + TypeScript.
- Global API prefix: `/api/v1`. Prefer Vite proxy `/api` → `http://localhost:3000`.
- White / soft-blue UI surface; primary actions are **blue buttons** (`#2563EB`).
- Fonts: Figtree (headings) + Noto Sans (body) via Google Fonts.
- No automated tests in this phase.
- No dark “developer console” aesthetic.

## What to implement

### Scaffold

```
dev-ui/
  package.json          # scripts: dev, build
  vite.config.ts        # proxy /api → localhost:3000
  index.html
  src/
    main.tsx
    App.tsx
    styles.css          # design tokens (white bg, blue primary)
    api/client.ts       # thin fetch helper + ApiError
    api/types.ts        # shared types stub (expand later)
    pages/HealthCheckPage.tsx   # or a simple home that pings health
  README.md             # how to run UI + API
```

### Requirements

1. `npm run dev` serves the app on port 5173 (or document the port).
2. App loads without console errors when the API is up.
3. Call `GET /api/v1/health` (public) and show a friendly online/offline state — proves proxy + client work.
4. CSS variables for colors, spacing, focus rings; `prefers-reduced-motion` respected.
5. Touch targets ≥ 44px for primary controls; visible `:focus-visible`.
6. Placeholder routing structure is fine (e.g. single page) — full router arrives in phase 1.

### Design tokens (minimum)

```css
--color-bg: #ffffff;
--color-bg-soft: #f0f7ff;
--color-primary: #2563eb;
--color-ink: #0f172a;
--color-muted: #64748b;
--color-border: #dbe7f5;
```

## Implementation style

- Keep the phase tiny and clean.
- Prefer semantic HTML.
- Do not invent product screens yet (no fake booking UI).

## Verify before finishing

1. API running: `curl http://localhost:3000/api/v1/health` works.
2. `cd dev-ui && npm install && npm run dev` — page loads.
3. UI shows healthy / connected when API is up; clear error when API is down.
4. `npm run build` in `dev-ui` succeeds.

## Out of scope

- Auth, clinic, doctors, appointments
- Automated tests
- Backend changes
- Mobile native apps

## Deliverable

A bootable Vite React TS app in `dev-ui/` with design tokens, API client stub, health check screen, and a short README. Summarize how to run it.
