# Implementation Prompt — Frontend Phase 6: Polish and MVP handoff

Copy this entire prompt into a new agent chat when you are ready to finalize the frontend.

---

## Role

You are implementing **Frontend Phase 6 — Polish and MVP handoff** for the Dental Clinic Planner web app. Frontend phases 0–5 and API phases 0–6 (including seed) should already work.

Do **not** add major new product features. Polish UX, empty/error states, copy, README, and verify the MVP definition of done from the staff/patient perspective. Do not write automated tests unless asked. Prefer not to change the backend; only fix frontend bugs found during verification.

## Read first (required)

1. [docs/phases/phase-6-seed-and-finalization.md](../docs/phases/phase-6-seed-and-finalization.md) — MVP definition of done
2. [docs/README.md](../docs/README.md) — out of scope list
3. [docs/architecture.md](../docs/architecture.md) — worked example (manual check still valuable)
4. [prompts/README.md](./README.md)
5. Existing `dev-ui/` full app

## Locked decisions

- Product UI only (not an API lab).
- White background, blue primary buttons, Figtree + Noto Sans.
- Seed credentials may be hinted on login for local demo only.
- No new endpoints; no multi-clinic; no payments.

## What to implement / polish

### UX consistency

1. Loading spinners / skeletons on every data fetch (>300ms feel).
2. Empty states with a next action (e.g. “Book a visit”, “Add booking”).
3. Error banners use API `message`; validation `details` when present.
4. Confirm dialogs before destructive cancel.
5. Focus states, 44px targets, `prefers-reduced-motion`.
6. Mobile-friendly layout for patient flows; staff day queue usable on desktop and tablet.

### Copy & clarity

1. Slot duration always visible; explain gap-fill briefly near treatment slots if helpful (one short line).
2. Distinguish consultation vs treatment consistently everywhere (badge + label).
3. Day-off vs fully booked empty states differ (from `isWorkingDay`).

### Docs

Update `dev-ui/README.md`:

- How to run API + UI + seed
- Seeded accounts table
- Patient vs staff route map
- Link to `docs/` and `prompts/`

### Optional small fixes

- Persist last selected doctor/date for staff queue
- After booking conflict, keep form and refresh slots
- Sign-out clears all sensitive local state

## MVP verification (hand-check)

Walk these against a seeded local API:

| Requirement | How to verify in the UI |
|---|---|
| Patient self-serve book + cancel | Register/login → book consultation & treatment → My visits → cancel |
| Staff queue + walk-in + cancel | Login nurse → day queue → add walk-in → cancel → slot free |
| Gap-fill scheduling visible | Reproduce architecture worked example via bookings; confirm 75-min slot appears and is bookable |
| Double-book handled | Two browsers same slot → one success, one clear 409 message |

Also confirm:

1. Seeded accounts login from UI.
2. No `passwordHash` ever appears in UI/network-rendered state.
3. `npm run build` in `dev-ui` succeeds.
4. Basic pass at 375px and 1280px widths.

## Out of scope

- New product modules (chat, payments, multi-location)
- Native mobile apps
- Automated E2E suites (unless explicitly requested)
- Redesigning the API

## Deliverable

Polished MVP frontend ready for local demo, README updated, verification notes for the four definition-of-done rows. Summarize any bugs fixed during polish.
