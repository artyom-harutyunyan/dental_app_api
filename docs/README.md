# Dental Clinic Planner API

Backend for a single-clinic, single-location dental booking system. Staff (doctors and nurses) manage the day's queue from a web client; patients self-book from a mobile client. This repository contains **only the API** — the web and mobile apps are separate projects that consume it.

## MVP goal

> Customers can self-book a correctly-sized slot without calling the clinic, and staff can manage the queue without double-bookings.

If a feature does not serve that sentence, it does not belong in the MVP.

## Out of scope

These are deliberately excluded. Do not build them, and do not add abstractions "in case" they arrive later.

- Multiple clinic locations / multi-tenancy
- Payments and insurance
- Doctor-specific service catalogs (every doctor can do consultation and treatment)
- Recurring or series bookings
- In-app chat, video consultations
- Multi-language, multi-currency
- Patient medical records beyond a single free-text `notes` field on an appointment
- Push notification infrastructure; email/SMS reminders are not part of the MVP
- Automated tests (explicitly excluded for this build)

## Stack

| Concern | Choice |
|---|---|
| Framework | NestJS 11 (TypeScript) |
| Database | MongoDB (standalone — no replica set required) |
| ODM | Mongoose via `@nestjs/mongoose` |
| API docs | `@nestjs/swagger`, served at `/api/docs` |
| Auth | `@nestjs/jwt` + `passport-jwt`, bcrypt password hashing |
| Validation | `class-validator` + `class-transformer` |
| Config | `@nestjs/config` with env schema validation |
| Date math | `luxon` (timezone-aware conversions) |

Two architectural decisions are load-bearing and worth stating up front:

1. **One `users` collection with a `role` field** (`patient` | `doctor` | `nurse`), and one JWT that carries the role. There are no separate patient and staff collections.
2. **No MongoDB transactions.** Double-booking is prevented by a partial unique index plus a post-insert overlap verification. This means a plain standalone `mongod` is enough for local development — you do not need to configure a replica set.

## Project layout

```
dental_api/
  docs/
    README.md                 <- you are here
    architecture.md           <- data model + scheduling engine spec
    phases/                   <- the build plan, one file per phase
  src/
    common/                   <- guards, decorators, filters, shared types
    config/                   <- env loading and validation
    modules/
      auth/
      users/
      clinics/
      doctors/
      availability/
      appointments/
    main.ts
    app.module.ts
  scripts/
    seed.ts
```

## Running it

```bash
# start MongoDB (standalone is fine)
docker run -d --name dental-mongo -p 27017:27017 mongo:7

npm install
cp .env.example .env

npm run start:dev     # API on http://localhost:3000, Swagger on http://localhost:3000/api/docs
npm run seed          # one clinic, two doctors, one nurse, one patient
```

## Build phases

Phases are strictly sequential — each one assumes everything before it exists and works. Read [architecture.md](./architecture.md) first; every phase refers back to it for schemas and for the slot algorithm.

| Phase | Title | Depends on | What you get at the end |
|---|---|---|---|
| 0 | [Project setup](./phases/phase-0-project-setup.md) | — | An app that boots, connects to MongoDB, and serves Swagger |
| 1 | [Authentication](./phases/phase-1-authentication.md) | 0 | Patients can register and log in; every route can be role-gated |
| 2 | [Clinic and doctors](./phases/phase-2-clinic-and-doctors.md) | 1 | Clinic settings (durations) exist and are editable; doctors are listable |
| 3 | [Working hours](./phases/phase-3-working-hours.md) | 2 | Each doctor has a weekly schedule and per-date exceptions |
| 4 | [Scheduling engine](./phases/phase-4-scheduling-engine.md) | 3 | `GET /doctors/:id/availability` returns correctly-sized slots |
| 5 | [Appointments](./phases/phase-5-appointments.md) | 4 | Bookings can be created and cancelled without double-booking |
| 6 | [Seed and finalization](./phases/phase-6-seed-and-finalization.md) | 5 | Seeded data, polished Swagger, MVP checklist verified |

Phase 4 is the highest-risk part of the product. Everything else is conventional CRUD; the slot algorithm is not. Build it as a pure function with no database access so it can be reasoned about in isolation.

## Endpoint summary

All routes are prefixed with `/api/v1`.

| Method | Path | Role | Phase |
|---|---|---|---|
| POST | `/auth/register` | public | 1 |
| POST | `/auth/login` | public | 1 |
| GET | `/auth/me` | any | 1 |
| GET | `/clinic` | any | 2 |
| PATCH | `/clinic` | staff | 2 |
| GET | `/doctors` | any | 2 |
| GET | `/doctors/:id` | any | 2 |
| GET | `/doctors/:id/working-hours` | any | 3 |
| PUT | `/doctors/:id/working-hours` | staff | 3 |
| GET | `/doctors/:id/schedule-exceptions` | staff | 3 |
| POST | `/doctors/:id/schedule-exceptions` | staff | 3 |
| DELETE | `/doctors/:id/schedule-exceptions/:exceptionId` | staff | 3 |
| GET | `/doctors/:id/availability` | any | 4 |
| POST | `/appointments` | any | 5 |
| GET | `/appointments` | staff | 5 |
| GET | `/appointments/mine` | patient | 5 |
| GET | `/appointments/:id` | any | 5 |
| DELETE | `/appointments/:id` | any | 5 |

"staff" means role `doctor` or `nurse`.
