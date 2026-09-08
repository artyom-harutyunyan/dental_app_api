# Yerevan Dental — frontend (`dev-ui`)

Product UI for the Dental Clinic Planner API: patient booking + staff day queue.

## Run

```bash
# API (repo root)
npm run start:dev
npm run seed

# Frontend
cd dev-ui
npm install
npm run dev
```

Open http://localhost:5173 — Vite proxies `/api` to `http://localhost:3000`.

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
