# Implementation Prompt — Frontend Phase 5: Appointments

Copy this entire prompt into a new agent chat when you are ready to implement booking + queue UX.

---

## Role

You are implementing **Frontend Phase 5 — Appointments** for the Dental Clinic Planner web app. Frontend phases 0–4 are done (including the slot picker). API phase 5 must work ([docs/phases/phase-5-appointments.md](../docs/phases/phase-5-appointments.md)).

Wire create / list / cancel flows for patients and staff. Do not write automated tests. Do not change the backend concurrency design.

## Read first (required)

1. [docs/phases/phase-5-appointments.md](../docs/phases/phase-5-appointments.md)
2. [docs/architecture.md](../docs/architecture.md) — appointment fields, soft cancel, 409 conflict message
3. [docs/README.md](../docs/README.md)
4. [prompts/README.md](./README.md)
5. Existing `dev-ui/` slot picker + auth roles

## API surface for this phase

| Method | Path | Access |
|---|---|---|
| POST | `/appointments` | any auth |
| GET | `/appointments?doctorId=&date=&status?` | staff |
| GET | `/appointments/mine` | patient |
| GET | `/appointments/:id` | any (own or staff) |
| DELETE | `/appointments/:id` | soft cancel |

### Create body rules

- Always send `doctorId`, `type`, `startTime` (UTC ISO from `slots[].start` **verbatim**).
- Do **not** send `endTime` — server derives it.
- Patient: server uses JWT identity; do not send walk-in fields.
- Staff walk-in: `patientName` + `patientPhone` (or `patientId` if you support selecting an existing patient).

Conflict `409` message (show verbatim to users):

> This slot was just taken by someone else. Please pick another time.

## Locked decisions

- Patient: Book flow completes with confirm → success feedback → My visits.
- Patient: My visits = upcoming (cancel) + past (read-only). Confirm before cancel.
- Staff: Day queue is the primary screen — doctor + date, chronological list, type + duration + patient, cancel.
- Staff: Add booking reuses slot picker + walk-in name/phone.
- After cancel, slot should reappear when availability is refetched.
- White UI, blue primary CTAs; cancel uses danger styling + confirm dialog.

## What to implement

### Patient

1. Finish **Book** — selected slot → `POST /appointments` → toast/banner → `/app/appointments`.
2. **My visits** — `GET /appointments/mine`; cancel via `DELETE`.

### Staff

1. **Day queue** — `GET /appointments?doctorId=&date=`; show cancelled too (dimmed) if API returns them.
2. **Add booking** — walk-in fields + slot → `POST`.
3. Cancel from queue with confirm.

### UX states

- Loading, empty day, no slots, booking success, 409 conflict recovery (“pick another time”), generic errors from `message`.

## Suggested files

```
dev-ui/src/pages/BookPage.tsx
dev-ui/src/pages/MyAppointmentsPage.tsx
dev-ui/src/pages/StaffQueuePage.tsx
dev-ui/src/pages/StaffBookPage.tsx
dev-ui/src/api/services.ts   # create, dayQueue, mine, cancel, getById
```

## Verify before finishing

1. Patient books consultation and treatment; both show under upcoming in My visits.
2. Patient cancels one; slot returns in availability for that doctor/date/type.
3. Staff sees the booking on day queue with patient name/phone.
4. Staff creates walk-in booking; appears on queue.
5. Force a double-book (two tabs same slot) → second shows 409 message.
6. Cancel twice is safe (no crash); UI refreshes cleanly.
7. `npm run build` succeeds.

## Out of scope

- Payments, reminders, recurring series
- Full calendar week grid (day list is enough)
- Automated tests
- Backend index / concurrency changes

## Deliverable

End-to-end booking UX for patient + staff against phase-5 APIs. Summarize flows and how 409 is handled.
