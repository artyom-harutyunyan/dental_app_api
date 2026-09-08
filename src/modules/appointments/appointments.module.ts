import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AvailabilityModule } from '../availability/availability.module';
import { ClinicsModule } from '../clinics/clinics.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { UsersModule } from '../users/users.module';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsQueryService } from './appointments-query.service';
import { AppointmentsService } from './appointments.service';
import { Appointment, AppointmentSchema } from './schemas/appointment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Appointment.name, schema: AppointmentSchema }]),
    UsersModule,
    ClinicsModule,
    DoctorsModule,
    forwardRef(() => AvailabilityModule),
  ],
  controllers: [AppointmentsController],
  providers: [AppointmentsService, AppointmentsQueryService],
  exports: [AppointmentsQueryService, MongooseModule],
})
export class AppointmentsModule {}
