# Phase 6 — Seed and finalization

## Goal

A one-command seed that puts the API into a usable state, Swagger documentation good enough for the web and mobile developers to build against without asking questions, and a verified checklist against the MVP definition of done.

## Depends on

[Phase 5](./phase-5-appointments.md).

## Files to create

```
scripts/seed.ts
```

Plus edits across the existing controllers and DTOs for the Swagger pass, and the root `README.md`.

## The seed script

Deliberately simple. This is developer convenience and a demo fixture, not a fixture framework — no faker, no factories, no randomization, no CLI flags.

What it creates:

- **One clinic** — name, `timezone: 'Asia/Yerevan'`, and the default durations (15 / 90 / 60 / 0).
- **Two doctors** — both `active`, both working Monday to Friday 09:00–18:00 (`startMinute: 540`, `endMinute: 1080`), Saturday and Sunday off.
- **One nurse** — same clinic.
- **One patient** — with a phone number, so the booking flow is testable straight away.

No appointments are seeded. Availability should be verified against a clean day first; bookings are made through the API so the booking path itself gets exercised.

Structure it as: connect via `NestFactory.createApplicationContext(AppModule)` so the script reuses the real services, config, and validation rather than a second parallel database setup. Wipe the four collections, insert, log the credentials, close the context.

Make it idempotent by wiping first. A seed that fails on second run because of a duplicate email is a seed people stop using.

Print the login credentials at the end. Passwords are shared and obvious on purpose — this only ever runs against a local database:

```
Seed complete.

  Doctor   doctor.one@clinic.test    / password123
  Doctor   doctor.two@clinic.test    / password123
  Nurse    nurse@clinic.test         / password123
  Patient  patient@example.test      / password123

  Swagger  http://localhost:3000/api/docs
```

Guard against running against a non-local database. Refuse to execute when `NODE_ENV === 'production'`, and abort if `MONGODB_URI` points at anything other than localhost. A seed script that drops collections is one careless environment variable away from being an incident.

Hash passwords through the same `AuthService` helper the login path uses. A seed with its own hashing call is how you end up with seeded accounts that cannot log in.

## Swagger pass

Everything so far annotated as it went; this pass makes the whole document coherent.

**Every endpoint** has `@ApiOperation` with a one-line summary written for the client developer, not restating the method name. "Returns bookable slots for a doctor on a date, sized dynamically" beats "Get availability".

**Every response** is declared with `@ApiResponse` including the DTO type — the `201`, and each error a client must actually handle. `409` on `POST /appointments` matters most; the mobile app has a dedicated "someone else took the slot" state and the developer needs to see that status documented.

**Every DTO property** has a realistic `example`. Client developers copy Swagger examples directly, so a `startTime` example of `"2026-09-15T07:00:00.000Z"` is worth more than `"string"`.

**Enums** are declared with `enum:` and `enumName:` so generated clients get real union types instead of bare strings.

Three descriptions carry real weight and should be written carefully rather than filled in:

1. `durationMinutes` on the slot DTO — state that it is per slot and authoritative, and that treatments are not always 90 minutes. This is the single most likely client-side mistake in the product.
2. `isWorkingDay` on the availability response — explain that it separates a day off from a fully booked day, since they need different empty states.
3. `startTime` everywhere — state that it is UTC and must be rendered in the clinic's timezone from `GET /clinic`.

Finally, tag every controller consistently with the tags registered in phase 0, and confirm the Authorize button works end to end: log in through Swagger, paste the token, call a protected endpoint.

## Root README

The root `README.md` is for someone cloning the repository, distinct from `docs/README.md` which is the build plan's entry point. Keep it to: what the service is in two sentences, prerequisites, the four setup commands, the seeded credentials, links to `/api/docs` and to `docs/`.

## Final review

Before calling the backend done, walk the whole surface once.

**Consistency.** Every `:id` route uses `ParseObjectIdPipe`. Every error goes through the global filter and has the same shape. No endpoint returns a raw Mongoose document with `_id` and `__v` instead of a mapped DTO.

**Security.** No response anywhere contains `passwordHash` — check `GET /doctors`, the day queue's embedded patient block, and `/auth/me` specifically. Every non-public route requires a token. Role restrictions are on the right endpoints: `PATCH /clinic`, `PUT /doctors/:id/working-hours`, the schedule exception routes, and `GET /appointments` are staff-only; `GET /appointments/mine` is patient-only.

**Configuration.** `.env.example` matches what the code reads, and `JWT_SECRET` has no usable default.

## MVP definition of done

Each item from Section 7 of the spec, mapped to where it is satisfied. Verify all four by hand.

| Requirement | Satisfied by | How to verify |
|---|---|---|
| A patient can register, book a consultation, book a treatment, and cancel either, entirely from the API | Phases 1, 4, 5 | Register a new patient, fetch availability for both types, book each, confirm both appear in `/appointments/mine`, cancel each |
| A doctor or nurse can see the day's queue, add a walk-in booking, and cancel a booking | Phases 1, 2, 5 | Log in as the seeded nurse, call `GET /appointments?doctorId=&date=`, create a booking with `patientName` and `patientPhone`, cancel it and confirm the slot returns to availability |
| Gap-fill scheduling is verified correct | Phase 4 | Reproduce the three stages of the [worked example](../architecture.md#worked-example); the 75-minute slot at 11:00 is the decisive check |
| No double-booking is possible under concurrent requests | Phase 5 | Fire two parallel bookings for one slot and confirm one `201`, one `409`, and a single `booked` document |

The spec calls for the gap-fill logic to be verified with automated tests. Automated tests were explicitly excluded from this build, so the worked example in `architecture.md` is the substitute: a written, hand-checkable specification with expected output at every stage. If tests are added later, that section converts into test cases directly.

## Done when

- `npm run seed` runs from a clean database, prints the credentials, and can be run twice in a row.
- The seed refuses to run against a non-local `MONGODB_URI`.
- All four seeded accounts can log in with the printed credentials.
- Swagger documents every endpoint with realistic examples, and a developer can authorize and complete a full booking flow without leaving the UI.
- All four definition-of-done rows are verified by hand.
