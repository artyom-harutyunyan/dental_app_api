# Implementation Prompt — Frontend Phase 1: Authentication

Copy this entire prompt into a new agent chat when you are ready to implement frontend auth.

---

## Role

You are implementing **Frontend Phase 1 — Authentication** for the Dental Clinic Planner web app. Frontend Phase 0 is done. The API auth endpoints from [docs/phases/phase-1-authentication.md](../docs/phases/phase-1-authentication.md) must already work.

Build real login/register/session UX. Do not build booking or staff queue yet. Do not write automated tests. Do not change the backend.

## Read first (required)

1. [docs/phases/phase-1-authentication.md](../docs/phases/phase-1-authentication.md)
2. [docs/architecture.md](../docs/architecture.md) — JWT payload `{ sub, role, clinicId }`, error shape
3. [docs/README.md](../docs/README.md) — endpoint table (auth rows)
4. [prompts/README.md](./README.md) — design defaults
5. Existing `dev-ui/` code from phase 0 — extend it

## API surface for this phase

| Method | Path | Access |
|---|---|---|
| POST | `/auth/register` | public (patients) |
| POST | `/auth/login` | public |
| GET | `/auth/me` | any authenticated |

Register body: `{ name, email, phone, password }`  
Login body: `{ email, password }`  
Auth response: `{ accessToken, user }` — store token; never display `passwordHash`.

## Locked decisions

- Single JWT for all roles (`patient` | `doctor` | `nurse`).
- Persist token + user in `localStorage` (or sessionStorage if you document why).
- On app load with a token, call `GET /auth/me` to refresh user; clear session on 401.
- Patients can self-register; staff accounts are seeded / admin-created — login only for staff (no staff signup UI).
- White background, blue primary buttons.
- Role redirect after login: patient → patient home stub; staff → staff home stub.

## What to implement

### Screens

1. **Login** — email + password, visible labels, loading on submit, field/API errors near form.
2. **Register (patient)** — name, email, phone, password (min 8). Link to login.
3. **Session shell stub** — signed-in header with name, role, Sign out. Empty main content is OK (“Coming next”).
4. Optional demo chips for seeded emails (if seed exists): patient / nurse / doctor — password `password123`.

### Client

- Attach `Authorization: Bearer <token>` on authenticated requests.
- Map API error body `{ message, details? }` into UI-friendly errors.
- Route guards: unauthenticated users cannot open app routes; redirect to `/login`.

### Suggested files

```
dev-ui/src/
  context/AuthContext.tsx
  api/services.ts          # register, login, me
  pages/LoginPage.tsx
  pages/RegisterPage.tsx
  components/AppShell.tsx  # minimal
  components/RequireAuth.tsx
  App.tsx                  # react-router routes
```

Add `react-router-dom` if not present.

## Implementation style

- Controlled form inputs.
- Disable submit while pending; show “Signing in…” / “Creating…”.
- Accessible labels; do not use placeholder-only labels.
- Match existing `dev-ui` patterns and tokens from phase 0.

## Verify before finishing

1. Register a new patient → lands in authenticated shell; token persisted; refresh keeps session.
2. Login as seeded patient and as nurse/doctor (if seed exists) → correct role shown.
3. Wrong password → clear error from API `message`.
4. Sign out → token cleared; protected routes redirect to login.
5. `GET /auth/me` works from the shell (or on bootstrap).
6. `npm run build` succeeds.

## Out of scope

- Booking, availability, day queue, working hours UI
- Changing API auth behavior
- Automated tests
- OAuth / OTP / social login

## Deliverable

Working auth UX wired to the API, with session persistence and role-aware redirects. Summarize routes and how session works.
