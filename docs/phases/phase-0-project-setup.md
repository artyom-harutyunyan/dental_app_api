# Phase 0 — Project setup

## Goal

A NestJS application that boots, validates its environment, connects to MongoDB, and serves Swagger. No business logic yet. The point of this phase is that every later phase can assume a working skeleton with consistent validation, error handling, and documentation already in place.

## Depends on

Nothing. This is the first phase.

## Files to create

```
package.json
tsconfig.json
nest-cli.json
.env.example
.gitignore
.prettierrc
src/
  main.ts
  app.module.ts
  config/
    configuration.ts
    env.validation.ts
  common/
    dto/error-response.dto.ts
    enums/user-role.enum.ts
    filters/http-exception.filter.ts
    interfaces/authenticated-request.interface.ts
  modules/
    health/
      health.module.ts
      health.controller.ts
      dto/health-response.dto.ts
```

## Dependencies to install

Runtime:

```
@nestjs/common @nestjs/core @nestjs/platform-express @nestjs/config
@nestjs/mongoose mongoose @nestjs/swagger swagger-ui-express
class-validator class-transformer luxon reflect-metadata rxjs
```

Dev:

```
@nestjs/cli @types/node @types/express @types/luxon typescript ts-node tsconfig-paths
```

Auth packages are deliberately deferred to phase 1 so this phase stays focused.

## Configuration

`.env.example` documents every variable. Keep it short; a variable that nothing reads should not be here.

```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/dental_api
JWT_SECRET=change-me-in-production
JWT_EXPIRES_IN=7d
```

`env.validation.ts` validates these at boot using a `class-validator` class and the `validate` option of `ConfigModule.forRoot`. Fail loudly and immediately on a missing or malformed variable — an app that starts with a bad `MONGODB_URI` and only fails on the first query wastes debugging time.

Environment values arrive as strings, so `PORT` needs `@Type(() => Number)` and an explicit `PORT: number = 3000` annotation. Omitting the annotation makes `emitDecoratorMetadata` record `Object`, which turns implicit conversion into a no-op and fails `@IsInt` on a perfectly valid port. See the validation note in [architecture.md](../architecture.md#cross-cutting-conventions) — the same rule applies to every DTO in later phases.

`configuration.ts` exposes a typed config factory so services read `config.get<string>('mongodb.uri')` rather than reaching into `process.env` directly.

## Implementation notes

**`AppModule`** wires three things: `ConfigModule.forRoot({ isGlobal: true, load: [configuration], validate })`, `MongooseModule.forRootAsync` pulling the URI from config, and `HealthModule`.

**`main.ts`** performs the bootstrap in a fixed order:

1. `app.setGlobalPrefix('api/v1')`
2. `app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true, transformOptions: { enableImplicitConversion: true } }))`
3. `app.useGlobalFilters(new HttpExceptionFilter())`
4. `app.enableCors()` — the web and mobile clients are separate origins
5. Swagger setup, then `SwaggerModule.setup('api/docs', app, document)`

Note that `setGlobalPrefix` runs before the Swagger setup so documented paths include `/api/v1`, while the docs UI itself stays at `/api/docs`.

**Swagger document builder** declares the bearer scheme now, even though nothing uses it until phase 1:

```ts
const config = new DocumentBuilder()
  .setTitle('Dental Clinic Planner API')
  .setDescription('Booking API for a single-clinic dental practice')
  .setVersion('1.0')
  .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'access-token')
  .addTag('auth')
  .addTag('clinic')
  .addTag('doctors')
  .addTag('availability')
  .addTag('appointments')
  .build();
```

Registering the tags up front keeps the Swagger sidebar in a sensible order instead of alphabetical accident.

**`HttpExceptionFilter`** catches everything, not just `HttpException`. Known exceptions keep their status and message; anything else becomes a `500` with a generic message while the original error is logged server-side. The output shape is the one fixed in [architecture.md](../architecture.md#cross-cutting-conventions), including the optional `details` array for validation failures. Back it with an `ErrorResponseDto` in `src/common/dto/` so later phases can reference the shape from `@ApiResponse` and Swagger documents errors accurately.

**`AuthenticatedRequest`** is a small interface extending Express's `Request` with a typed `user: JwtPayload`, where `JwtPayload` is `{ sub: string; role: UserRole; clinicId: string | null }`. It is created here so controllers in later phases never reach for `any` when reading the JWT payload. This pulls `src/common/enums/user-role.enum.ts` forward from phase 1 — the enum is a shared type with no behaviour, so defining it here rather than duplicating a string union is the smaller compromise.

**Health controller** exposes `GET /api/v1/health` returning `{ status, database, timestamp }`, mapping the Mongoose connection's `readyState` to a readable state and reporting `degraded` when it is anything other than connected. It is a genuinely useful smoke test for the rest of the build.

**Scripts** in `package.json`:

```json
{
  "start:dev": "nest start --watch",
  "build": "nest build",
  "start:prod": "node dist/main",
  "typecheck": "tsc --noEmit -p tsconfig.json",
  "seed": "ts-node -r tsconfig-paths/register scripts/seed.ts"
}
```

The `seed` script is declared now but not written until phase 6.

## Done when

- `npm run start:dev` boots with no errors and logs a successful MongoDB connection.
- `GET /api/v1/health` returns `{ "status": "ok", "database": "connected" }`.
- `http://localhost:3000/api/docs` renders the Swagger UI with the title, version, the registered tags, and an "Authorize" button, and `/api/docs-json` shows the `access-token` security scheme with paths carrying the `/api/v1` prefix.
- An unknown route returns the normalized error body rather than Express's default HTML.
- Starting the app with `MONGODB_URI` removed from `.env` fails immediately with a clear validation message naming the variable, rather than booting and failing later.
