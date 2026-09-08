# Frontend implementation prompts

Copy-paste prompts for an AI coding agent to build the **web frontend** against the Dental Clinic Planner API, one phase at a time.

Phases are sequential — finish each phase before starting the next. The API for that phase (and earlier ones) must already exist and be running.

| Phase | Prompt | Frontend outcome | API must have |
|---|---|---|---|
| 0 | [phase-0-frontend-setup.md](./phase-0-frontend-setup.md) | App boots, talks to API | API health / project exists |
| 1 | [phase-1-frontend-auth.md](./phase-1-frontend-auth.md) | Login, register, session | Auth endpoints |
| 2 | [phase-2-frontend-clinic-doctors.md](./phase-2-frontend-clinic-doctors.md) | Clinic + doctor list | Clinic & doctors |
| 3 | [phase-3-frontend-working-hours.md](./phase-3-frontend-working-hours.md) | Staff hours & exceptions UI | Working hours APIs |
| 4 | [phase-4-frontend-availability.md](./phase-4-frontend-availability.md) | Slot picker (live durations) | Availability API |
| 5 | [phase-5-frontend-appointments.md](./phase-5-frontend-appointments.md) | Book, queue, mine, cancel | Appointments APIs |
| 6 | [phase-6-frontend-polish.md](./phase-6-frontend-polish.md) | UX polish, empty states, README | Full API + seed |

## How to use

1. Start the API (`npm run start:dev`, `npm run seed` when available).
2. Open a **new** agent chat.
3. Paste the entire contents of the phase prompt file.
4. Let the agent implement only that phase.
5. Hand-check the **Verify before finishing** section, then move on.

## Design defaults (all phases)

Unless a phase prompt says otherwise:

- White / soft sky background, **blue primary buttons** (`#2563EB`)
- Figtree (headings) + Noto Sans (body)
- Role-aware UI: patient vs staff (`doctor` | `nurse`)
- No API-playground / Swagger-style console — real product screens
- No automated tests unless asked
- Consume API under `/api/v1` (Vite proxy or configurable base URL)

## Related docs

- [docs/README.md](../docs/README.md) — API overview & endpoint table
- [docs/architecture.md](../docs/architecture.md) — scheduling rules, timezones, error shape
- [docs/phases/](../docs/phases/) — backend phase specs
- Backend AI prompts (API): [docs/phase-5-implementation-prompt.md](../docs/phase-5-implementation-prompt.md), [docs/phase-6-implementation-prompt.md](../docs/phase-6-implementation-prompt.md)
