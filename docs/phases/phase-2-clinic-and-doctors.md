# Phase 2 — Clinic and doctors

## Goal

The clinic document exists and carries the scheduling constants the engine will read. Doctors are listable so the mobile client can render its "pick a doctor" screen. This is the last conventional-CRUD phase before the scheduling work begins.

## Depends on

[Phase 1](./phase-1-authentication.md).

## Files to create

```
src/modules/clinics/
  schemas/clinic.schema.ts
  clinics.module.ts
  clinics.service.ts
  clinics.controller.ts
  dto/update-clinic.dto.ts
  dto/clinic-response.dto.ts
  interfaces/clinic-scheduling-settings.interface.ts
src/modules/doctors/
  doctors.module.ts
  doctors.service.ts
  doctors.controller.ts
  dto/doctor-response.dto.ts
```

There is no `doctors` schema. A doctor is a `users` document with `role: 'doctor'`, per the single-collection decision in [architecture.md](../architecture.md#users). `DoctorsService` reads through `UsersService`, so `DoctorsModule` imports `UsersModule`.

## Schemas

The `clinics` schema follows the table in [architecture.md](../architecture.md#clinics). Every numeric setting gets a Mongoose `default`, so a clinic created with only a name and timezone is immediately valid and correctly configured.

`ClinicSchedulingSettings` is the narrow interface the scheduling engine consumes:

```ts
export interface ClinicSchedulingSettings {
  consultationDurationMinutes: number;
  treatmentDurationMinutes: number;
  minTreatmentDurationMinutes: number;
  bufferMinutes: number;
}
```

Passing this instead of the whole clinic document keeps the pure calculator in phase 4 from depending on Mongoose types.

## The single-clinic assumption

The MVP has exactly one clinic. Rather than scatter that assumption around, put it in one place: `ClinicsService.getClinic()` returns the single document, throwing `500` with a message pointing at the seed if none exists.

Do not add a `/clinics` collection endpoint or accept a clinic id in any route. Multi-location is explicitly out of scope, and a fake list endpoint returning one item is worse than no endpoint — it implies a capability that does not exist. Staff users still carry `clinicId` on their token so the eventual multi-tenant migration has a hook, but nothing branches on it yet.

Add a small `getSchedulingSettings()` method returning `ClinicSchedulingSettings`, and cache the clinic document in memory for a short TTL (60 seconds is plenty). Availability is the hottest endpoint in the product and it reads these settings on every call; refetching a document that changes a few times a year is pointless.

## Endpoints

### `GET /clinic`

Any authenticated role. Returns `ClinicResponseDto`: `id`, `name`, `timezone`, and the four duration settings.

Both clients need `timezone` to render UTC timestamps correctly, and the mobile client can show "treatments are usually 90 minutes" copy from `treatmentDurationMinutes` without hardcoding it.

### `PATCH /clinic`

Staff only — `@Roles(UserRole.DOCTOR, UserRole.NURSE)`.

`UpdateClinicDto` has every field optional: `name`, `timezone`, `consultationDurationMinutes`, `treatmentDurationMinutes`, `minTreatmentDurationMinutes`, `bufferMinutes`.

Validation is worth taking seriously here, because a bad value silently corrupts every slot the engine produces afterwards:

- All durations are integers of at least `1`, with a sane upper bound such as `480`.
- `minTreatmentDurationMinutes` must be less than or equal to `treatmentDurationMinutes`. A minimum above the standard length means no treatment is ever offered, and the failure looks like an empty availability response rather than a config error.
- `bufferMinutes` is at least `0`.
- `timezone` must be a valid IANA name — verify with `IANAZone.isValidZone()` from `luxon` rather than trusting a regex.

Cross-field checks that a decorator cannot express belong in the service, throwing `400` with a message naming both fields.

Invalidate the settings cache after a successful update.

### `GET /doctors`

Any authenticated role. Returns `DoctorResponseDto[]` for users with `role: 'doctor'` and `active: true`, sorted by name.

`DoctorResponseDto` carries `id`, `name`, and optionally a `specialty`-style label if one is wanted later — but not `email`, `phone`, or `workingHours`. This endpoint feeds a patient-facing picker; staff contact details do not belong in a patient response, and working hours are a separate concern with its own endpoint in phase 3.

Inactive doctors are excluded because this is the "who can I book with" list. Staff needing the full roster is not an MVP requirement.

### `GET /doctors/:id`

Any authenticated role. Same DTO, single record. Returns `404` when the id does not exist, when the user is not a doctor, or when the doctor is inactive — all three collapse to the same response so the endpoint does not leak the existence of non-doctor accounts.

Validate the `:id` parameter as a Mongo ObjectId with a reusable `ParseObjectIdPipe`. Without it, a malformed id throws a Mongoose `CastError` that surfaces as a `500` instead of a `400`. Add the pipe to `src/common/pipes/` and use it for every `:id` route from here on.

## Implementation notes

`DoctorsService.findActiveDoctorOrFail(id)` is the accessor every later phase uses before computing availability or creating a booking. Writing it here means phases 3 through 5 never re-implement the "is this a real, active doctor" check.

Keep `DoctorsService` free of working-hours logic. Phase 3 adds those methods to the same service, but they are a distinct concern and should not be entangled with the listing queries.

## Done when

- `GET /clinic` returns the seeded clinic with all four duration settings and a valid IANA timezone.
- `PATCH /clinic` succeeds for a staff token and returns `403` for a patient token.
- `PATCH /clinic` with `minTreatmentDurationMinutes` greater than `treatmentDurationMinutes` returns `400` naming both fields.
- `PATCH /clinic` with `timezone: "Not/AZone"` returns `400`.
- `GET /doctors` lists only active doctors and exposes no email, phone, or password data.
- `GET /doctors/:id` returns `404` for a patient's id and `400` for a malformed id.
