# Phase 1 — Authentication

## Goal

Patients can register and log in. Staff can log in with accounts created by the seed. Every route in the application can be restricted by role. After this phase, no later phase ever has to think about identity again — it just applies a decorator.

## Depends on

[Phase 0](./phase-0-project-setup.md).

## Files to create

```
src/common/
  enums/user-role.enum.ts
  decorators/public.decorator.ts
  decorators/roles.decorator.ts
  decorators/current-user.decorator.ts
  guards/jwt-auth.guard.ts
  guards/roles.guard.ts
src/modules/users/
  schemas/user.schema.ts
  schemas/working-hours.schema.ts
  users.module.ts
  users.service.ts
src/modules/auth/
  auth.module.ts
  auth.controller.ts
  auth.service.ts
  strategies/jwt.strategy.ts
  dto/register.dto.ts
  dto/login.dto.ts
  dto/auth-response.dto.ts
  dto/user-response.dto.ts
```

## Dependencies to install

```
@nestjs/jwt @nestjs/passport passport passport-jwt bcrypt
@types/passport-jwt @types/bcrypt
```

## Schemas

`UserRole` is a string enum with `PATIENT = 'patient'`, `DOCTOR = 'doctor'`, `NURSE = 'nurse'`. Add a `STAFF_ROLES` constant containing doctor and nurse — several places need "is this person staff" and duplicating the pair invites drift.

The `users` schema follows the table in [architecture.md](../architecture.md#users). Two details matter here:

`passwordHash` is declared with `select: false` so it never leaves the database unless a query explicitly asks for it. The login path is the only place that asks, via `.select('+passwordHash')`. Combine this with a `toJSON` transform that deletes `passwordHash` and `__v` and maps `_id` to `id`. Belt and braces is appropriate for a credential field.

`workingHours` is embedded here as a `WorkingHoursEntry[]` subdocument array, but it is not populated or exposed until [phase 3](./phase-3-working-hours.md). Defining it now avoids a schema migration mid-build.

## DTOs

`RegisterDto` — `name` (string, 2–100 chars), `email` (`@IsEmail`, normalized to lowercase with `@Transform`), `phone` (`@IsPhoneNumber` or a permissive regex), `password` (minimum 8 characters). It has no `role` field. Accepting a role from a registration body is how you end up with a patient who made themselves a doctor.

`LoginDto` — `email`, `password`.

`AuthResponseDto` — `accessToken` (string) and `user` (a nested `UserResponseDto`).

`UserResponseDto` — `id`, `name`, `email`, `phone`, `role`, `clinicId`. Never `passwordHash`.

Every DTO property carries both a `class-validator` decorator and an `@ApiProperty` with a realistic `example`. Swagger examples are what the web and mobile developers copy, so wrong examples cost more than missing ones.

## Endpoints

### `POST /auth/register`

Public. Creates a patient and returns a token, so registration flows straight into a logged-in state on mobile.

Always sets `role: 'patient'` and `clinicId: null`, ignoring anything the client sends. A duplicate email returns `409 Conflict` — catch the Mongo duplicate-key error (code `11000`) rather than doing a find-then-insert, which races.

### `POST /auth/login`

Public. One endpoint for both patients and staff. The role comes back in the response so each client knows what it is dealing with; the web client rejects a `patient` role at its own login screen, and mobile rejects staff roles.

Invalid email and invalid password both return the same `401 Unauthorized` with the same message. Distinguishing them tells an attacker which emails are registered.

Reject `active: false` users with `401` as well — deactivating a doctor should lock them out.

### `GET /auth/me`

Authenticated, any role. Returns the current `UserResponseDto`. Clients call this on startup to validate a stored token.

## Implementation notes

**Password hashing** uses bcrypt with a cost factor of 10. Hash inside `AuthService`, not in a Mongoose pre-save hook — the hook version silently re-hashes an already-hashed value on unrelated updates, and that bug is genuinely unpleasant to track down.

**`JwtStrategy`** extracts the bearer token, verifies it against `JWT_SECRET`, and returns `{ sub, role, clinicId }` from the payload. Do not load the user from the database on every request in the MVP; the token payload is sufficient and a per-request lookup on every endpoint is wasted work at this scale.

**`JwtAuthGuard` is registered globally** in `AppModule` as an `APP_GUARD` provider, with `RolesGuard` registered immediately after it. Ordering matters: authentication must resolve before authorization reads the role.

Global-by-default means secure-by-default. Forgetting a guard on a new endpoint leaves it protected rather than open. Public endpoints opt out:

```ts
@Public()
@Post('login')
login(@Body() dto: LoginDto) { ... }
```

`JwtAuthGuard` reads the `IS_PUBLIC_KEY` metadata via `Reflector` and short-circuits when present.

**`RolesGuard`** reads `@Roles(...)` metadata from the handler and the controller class. When no roles are declared, any authenticated user passes. When roles are declared, the JWT's `role` must be among them, otherwise `403 Forbidden`.

**`@CurrentUser()`** is a param decorator returning the typed JWT payload, so controllers read `@CurrentUser() user: JwtPayload` instead of `@Req() req: any`.

**Health and Swagger** must keep working. Mark the health controller `@Public()` when adding the global guard, or the smoke test from phase 0 starts returning `401`.

**Retrofit phase 0's Swagger.** Add `@ApiBearerAuth('access-token')` to protected controllers so the UI's Authorize button actually applies the token to them.

## Done when

- `POST /auth/register` creates a patient and returns a working token; a second registration with the same email returns `409`.
- `POST /auth/login` returns a token for both a patient and a seeded staff account, and returns an identical `401` for a wrong password and an unknown email.
- `GET /auth/me` returns the caller's profile with the bearer token, and `401` without one.
- No response anywhere in the API contains `passwordHash`.
- A route annotated `@Roles(UserRole.DOCTOR, UserRole.NURSE)` returns `403` for a patient token.
- Swagger shows lock icons on protected routes and lets you authorize once and call them.
