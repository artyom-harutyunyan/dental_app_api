# Dental Clinic Planner API

Backend API for a single-clinic dental booking system. Staff manage the day queue from a web client; patients self-book from a mobile client — this repo is the API only.

## Prerequisites

- Node.js 20+
- MongoDB 7+ running locally (standalone is fine)

## Setup

```bash
npm install
npm --prefix dev-ui install
cp .env.example .env
npm run build:dev-ui
npm run start:dev
npm run seed
```

API: `http://localhost:3000/api/v1`  
Swagger: [http://localhost:3000/api/docs](http://localhost:3000/api/docs)  
Dev UI: [http://localhost:3000/dev-ui](http://localhost:3000/dev-ui)

## Seeded credentials

| Role    | Email                     | Password    |
|---------|---------------------------|-------------|
| Doctor  | `doctor.one@clinic.test`  | `password123` |
| Doctor  | `doctor.two@clinic.test`  | `password123` |
| Nurse   | `nurse@clinic.test`       | `password123` |
| Patient | `patient@example.test`    | `password123` |

`npm run seed` wipes local demo collections and recreates this fixture. It refuses production and non-localhost MongoDB URIs.

## Docs

Build plan and architecture live under [`docs/`](./docs/).
