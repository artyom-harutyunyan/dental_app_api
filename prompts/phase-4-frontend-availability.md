# Implementation Prompt — Frontend Phase 4: Availability (scheduling UI)

Copy this entire prompt into a new agent chat when you are ready to implement the slot picker.

---

## Role

You are implementing **Frontend Phase 4 — Availability UI** for the Dental Clinic Planner web app. Frontend phases 0–3 are done. API phase 4 must work ([docs/phases/phase-4-scheduling-engine.md](../docs/phases/phase-4-scheduling-engine.md)).

Build the **slot selection experience** used by patients and staff. You may create a booking **wizard shell** that stops before `POST /appointments` (that is phase 5). Do not write automated tests. Do not reimplement the slot algorithm on the client. Do not change the backend.

## Read first (required)

1. [docs/phases/phase-4-scheduling-engine.md](../docs/phases/phase-4-scheduling-engine.md)
2. [docs/architecture.md](../docs/architecture.md) — worked example, `durationMinutes`, `isWorkingDay`, UTC vs clinic timezone
3. [docs/README.md](../docs/README.md)
4. [prompts/README.md](./README.md)
5. Existing `dev-ui/` doctors + clinic timezone

## API surface for this phase

| Method | Path | Access |
|---|---|---|
| GET | `/doctors/:id/availability?date=&type=` | any auth |

Query:

- `date` — `YYYY-MM-DD` in **clinic-local** calendar (not the browser’s assumed zone for the label)
- `type` — `consultation` | `treatment`

Response includes: `isWorkingDay`, `timezone`, `slots[]` with `{ start, end, durationMinutes, type }`.

**Critical:** `durationMinutes` is authoritative per slot. Treatments are **not always 90**. Never hardcode treatment length in the UI.

## Locked decisions

- Client **never** computes slots — only renders API output.
- Every selectable slot shows **start time + duration** (and ideally end time).
- Odd durations (e.g. 75 min) must look intentional, not like an error (distinct duration pill is fine).
- Distinguish consultation vs treatment with badge/color **and** text (not color alone).
- Render times with `clinic.timezone` from `GET /clinic` (e.g. `Asia/Yerevan`).
- Empty states:
  - `isWorkingDay === false` → “Doctor is off this day”
  - working day but `slots.length === 0` → “No open slots — try another date”
- White UI, blue primary actions.

## What to implement

### Shared component

`SlotList` (or equivalent):

- Props: slots, timezone, selectedStart, onSelect
- Keyboard-focusable rows; selected state visible
- Loading skeleton/spinner while fetching

### Screens / flows

1. **Patient book wizard (partial)** — doctor, type, date → fetch availability → select slot. Confirm button may be disabled with “Booking comes in phase 5” **or** navigate to a stub — do **not** call `POST /appointments` yet unless phase 5 is already in the repo and you only wire UI later.
2. **Staff add-booking step (partial)** — same slot picker for consistency.

Prefer implementing the real picker once and reusing it.

### Client

```ts
availability(token, doctorId, date, type) → AvailabilityResponse
```

Refetch when doctor, date, or type changes. Clear selection on refetch.

## Verify before finishing

1. Pick a weekday with seeded Mon–Fri hours → consultation slots start at 09:00 local.
2. Treatment slots show multiple 90-min options (and possible shorter tail) — durations visible.
3. After booking exists from API/manual test, availability shrinks (if appointments already exist in env); otherwise document manual check with curl then refresh UI.
4. Sunday / day-off exception → `isWorkingDay` empty state.
5. Gap-fill awareness: if API returns 75-min slot, UI shows “75 min” clearly.
6. `npm run build` succeeds.

## Out of scope

- `POST /appointments` commit flow (phase 5) — unless already present; do not invent concurrency UI beyond showing API errors later
- Reimplementing scheduling math in the browser
- Automated tests
- Backend algorithm changes

## Deliverable

Reusable slot picker + patient/staff availability step wired to `GET .../availability`. Summarize how durations and day-off empty states are shown.
