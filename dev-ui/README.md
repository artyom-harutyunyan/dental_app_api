# Yerevan Dental — frontend (`dev-ui`)

Product UI for the Dental Clinic Planner API: patient booking + staff day queue.

## Run (served by the API)

Build the UI, then start the API. Nest serves the static build at `/dev-ui`.

```bash
# From repo root
npm --prefix dev-ui install
npm run build:dev-ui
npm run start:dev
npm run seed
```

Open [http://localhost:3000/dev-ui](http://localhost:3000/dev-ui).

## Local Vite (optional)

Useful for hot reload while iterating on the UI alone:

```bash
cd dev-ui
npm install
npm run dev
```

Open http://localhost:5173/dev-ui/ — Vite proxies `/api` to `http://localhost:3000`.

## Flows

**Patient**
- Register / login
- Choose doctor → book (type, date, slots with live duration) → my visits → cancel

**Staff (doctor / nurse)**
- Login
- Day queue (doctor + date)
- Add walk-in booking
- Working hours & date exceptions
- Clinic duration settings

## Seeded logins

| Role | Email | Password |
|---|---|---|
| Patient | `patient@example.test` | `password123` |
| Nurse | `nurse@clinic.test` | `password123` |
| Doctor | `doctor.one@clinic.test` | `password123` |
