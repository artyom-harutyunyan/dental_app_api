# Implementation Prompt — Frontend Phase 2: Clinic and doctors

Copy this entire prompt into a new agent chat when you are ready to implement clinic + doctors UI.

---

## Role

You are implementing **Frontend Phase 2 — Clinic and doctors** for the Dental Clinic Planner web app. Frontend phases 0–1 are done. API phase 2 endpoints must work ([docs/phases/phase-2-clinic-and-doctors.md](../docs/phases/phase-2-clinic-and-doctors.md)).

Do not build booking or working-hours editors yet. Do not write automated tests. Do not change the backend.

## Read first (required)

1. [docs/phases/phase-2-clinic-and-doctors.md](../docs/phases/phase-2-clinic-and-doctors.md)
2. [docs/architecture.md](../docs/architecture.md) — clinic fields, timezone note
3. [docs/README.md](../docs/README.md)
4. [prompts/README.md](./README.md)
5. Existing `dev-ui/` auth + shell

## API surface for this phase

| Method | Path | Access |
|---|---|---|
| GET | `/clinic` | any auth |
| PATCH | `/clinic` | staff only |
| GET | `/doctors` | any auth |
| GET | `/doctors/:id` | any auth |

Clinic includes: `name`, `timezone`, `consultationDurationMinutes`, `treatmentDurationMinutes`, `minTreatmentDurationMinutes`, `bufferMinutes`.

Doctors list returns active bookable doctors (`id`, `name` — no password hashes).

## Locked decisions

- Load clinic once after login (AuthContext or ClinicContext); expose `timezone` for later date rendering.
- Patient home: list doctors with a clear primary CTA (“Book” can link to a stub route for phase 4/5).
- Staff: clinic settings page (edit durations / name / timezone) — hide from patients.
- White UI, blue buttons; consultation/treatment colors may be introduced as badges later.
- All times remain UTC from API; display timezone comes from `GET /clinic`.

## What to implement

### Patient

- **Doctors home** (`/app` or similar): cards/list of doctors from `GET /doctors`.
- Empty state if no doctors.
- Loading and error banners.

### Staff

- **Clinic settings** (`/staff/clinic`): form bound to clinic fields; `PATCH /clinic` on save; success/error feedback.
- Patients hitting this route → redirect away (403-equivalent UX).

### Shared

- Keep session shell nav updated: patient sees Doctors; staff sees Clinic (and stubs for later items).
- Store selected `doctorId` in URL query or light app state for later phases.

## Suggested files

```
dev-ui/src/pages/PatientHomePage.tsx
dev-ui/src/pages/ClinicSettingsPage.tsx
dev-ui/src/api/services.ts   # getClinic, updateClinic, listDoctors, getDoctor
```

## Verify before finishing

1. Authenticated patient sees doctor list matching `GET /doctors`.
2. Staff can open clinic settings, change a field (e.g. name or buffer), save, reload — value persists.
3. Patient cannot successfully use clinic settings UI (redirect or disabled).
4. Clinic timezone is available in app state after login.
5. `npm run build` succeeds.

## Out of scope

- Availability slots, appointments, working hours forms
- Multi-clinic / doctor profiles beyond list + name
- Automated tests
- Backend changes

## Deliverable

Patient doctor list + staff clinic settings, wired to phase-2 APIs. Summarize routes and state for `clinic` / `doctorId`.
