/**
 * Local demo seed. Wipes clinics, users, schedule_exceptions, and appointments,
 * then inserts one clinic + two doctors + one nurse + one patient.
 *
 * Usage: npm run seed
 */
import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { getConnectionToken, getModelToken } from '@nestjs/mongoose';
import { config as loadEnv } from 'dotenv';
import { Connection, Model } from 'mongoose';

import { AppModule } from '../src/app.module';
import { UserRole } from '../src/common/enums/user-role.enum';
import { AuthService } from '../src/modules/auth/auth.service';
import { Clinic, ClinicDocument } from '../src/modules/clinics/schemas/clinic.schema';
import { UsersService } from '../src/modules/users/users.service';
import { WorkingHoursEntry } from '../src/modules/users/schemas/working-hours.schema';

const SEED_PASSWORD = 'password123';

const MON_FRI_HOURS: WorkingHoursEntry[] = [0, 1, 2, 3, 4, 5, 6].map((weekday) => {
  const isWeekend = weekday === 0 || weekday === 6;
  return {
    weekday,
    isDayOff: isWeekend,
    startMinute: isWeekend ? null : 540,
    endMinute: isWeekend ? null : 1080,
  };
});

function assertSafeToSeed(): void {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to seed: NODE_ENV=production');
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('Refusing to seed: MONGODB_URI is not set');
  }

  const hostname = extractMongoHostname(uri);
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    throw new Error(
      `Refusing to seed: MONGODB_URI host must be localhost or 127.0.0.1 (got "${hostname}")`,
    );
  }
}

function extractMongoHostname(uri: string): string {
  const withoutProtocol = uri.replace(/^mongodb(\+srv)?:\/\//i, '');
  const authority = withoutProtocol.split('/')[0] ?? '';
  const hostPort = authority.includes('@') ? authority.split('@').pop()! : authority;
  return (hostPort.split(':')[0] ?? '').toLowerCase();
}

async function seed(): Promise<void> {
  loadEnv();
  assertSafeToSeed();

  const logger = new Logger('Seed');
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const connection = app.get<Connection>(getConnectionToken());
    const clinicModel = app.get<Model<ClinicDocument>>(getModelToken(Clinic.name));
    const authService = app.get(AuthService);
    const usersService = app.get(UsersService);

    const collections = ['clinics', 'users', 'schedule_exceptions', 'appointments'] as const;
    for (const name of collections) {
      await connection.collection(name).deleteMany({});
    }
    logger.log(`Wiped collections: ${collections.join(', ')}`);

    const clinic = await clinicModel.create({
      name: 'Yerevan Dental Clinic',
      timezone: 'Asia/Yerevan',
      consultationDurationMinutes: 15,
      treatmentDurationMinutes: 90,
      minTreatmentDurationMinutes: 60,
      bufferMinutes: 0,
    });

    const passwordHash = await authService.hashPassword(SEED_PASSWORD);

    const doctorOne = await usersService.create({
      name: 'Dr. Ani Hakobyan',
      email: 'doctor.one@clinic.test',
      phone: '+37499000001',
      passwordHash,
      role: UserRole.DOCTOR,
      clinicId: clinic._id,
      active: true,
    });
    await usersService.updateWorkingHours(doctorOne.id, MON_FRI_HOURS);

    const doctorTwo = await usersService.create({
      name: 'Dr. Armen Petrosyan',
      email: 'doctor.two@clinic.test',
      phone: '+37499000002',
      passwordHash,
      role: UserRole.DOCTOR,
      clinicId: clinic._id,
      active: true,
    });
    await usersService.updateWorkingHours(doctorTwo.id, MON_FRI_HOURS);

    await usersService.create({
      name: 'Nurse Mariam',
      email: 'nurse@clinic.test',
      phone: '+37499000003',
      passwordHash,
      role: UserRole.NURSE,
      clinicId: clinic._id,
      active: true,
    });

    await usersService.create({
      name: 'Anna Petrosyan',
      email: 'patient@example.test',
      phone: '+37499111222',
      passwordHash,
      role: UserRole.PATIENT,
      clinicId: null,
      active: true,
    });

    const port = process.env.PORT ?? '3000';

    // Exact credential block expected by phase 6 docs / client developers.
    console.log(`
Seed complete.

  Doctor   doctor.one@clinic.test    / password123
  Doctor   doctor.two@clinic.test    / password123
  Nurse    nurse@clinic.test         / password123
  Patient  patient@example.test      / password123

  Swagger  http://localhost:${port}/api/docs
`);
  } finally {
    await app.close();
  }
}

seed().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  new Logger('Seed').error(message);
  process.exit(1);
});
