# Implementation Prompt — Frontend Phase 3: Working hours

Copy this entire prompt into a new agent chat when you are ready to implement staff schedule UI.

---

## Role

You are implementing **Frontend Phase 3 — Working hours** for the Dental Clinic Planner web app. Frontend phases 0–2 are done. API phase 3 endpoints must work ([docs/phases/phase-3-working-hours.md](../docs/phases/phase-3-working-hours.md)).

This is a **staff-only** feature. Do not build patient booking yet. Do not write automated tests. Do not change the backend.

## Read first (required)

1. [docs/phases/phase-3-working-hours.md](../docs/phases/phase-3-working-hours.md)
2. [docs/architecture.md](../docs/architecture.md) — `WorkingHoursEntry`, `schedule_exceptions`, minutes-from-midnight
3. [docs/README.md](../docs/README.md)
4. [prompts/README.md](./README.md)
5. Existing `dev-ui/` staff shell + doctor list

## API surface for this phase

| Method | Path | Access |
|---|---|---|
| GET | `/doctors/:id/working-hours` | any auth |
| PUT | `/doctors/:id/working-hours` | staff |
| GET | `/doctors/:id/schedule-exceptions` | staff |
| POST | `/doctors/:id/schedule-exceptions` | staff |
| DELETE | `/doctors/:id/schedule-exceptions/:exceptionId` | staff |

Weekly body shape: `{ weekly: WorkingHoursEntry[7] }` with `weekday` 0–6, `isDayOff`, `startMinute` / `endMinute` (null when day off).

Examples: `540` = 09:00, `1080` = 18:00 clinic-local.

Exceptions: `{ date: YYYY-MM-DD, isDayOff, startMinute?, endMinute?, reason? }`.

## Locked decisions

- Staff page: pick doctor → load weekly grid → edit → PUT full week (replace semantics).
- Exceptions: list + create/upsert form + delete with confirm.
- Patients do not see this nav item.
- Show helper text that minutes are from local midnight (do not invent a broken clock widget unless simple).
- White UI, blue primary save button; destructive remove uses red soft style.

## What to implement

### Screens

1. **Working hours** (`/staff/hours`)
   - Doctor select
   - 7-row weekly editor (day name, day-off checkbox, start/end minutes)
   - Save weekly hours
   - Exceptions section: date, day-off toggle, optional window, reason; list with remove

### Client helpers

- Map API `weekly` entries into form state and back.
- On doctor change, reload hours + exceptions.
- Surface validation errors from API `message` / `details`.

## Verify before finishing

1. Staff loads hours for doctor one — Mon–Fri 540–1080, weekends off (seed default).
2. Change one day and save — reload shows the change.
3. Create a holiday exception (`isDayOff: true`) — appears in list; delete removes it.
4. Patient cannot open the hours route.
5. `npm run build` succeeds.

## Out of scope

- Availability visualization / booking
- Drag-drop calendar
- Automated tests
- Backend schema changes

## Deliverable

Staff working-hours + exceptions UI fully wired to phase-3 APIs. Summarize UX and any helpers for minutes labels.
