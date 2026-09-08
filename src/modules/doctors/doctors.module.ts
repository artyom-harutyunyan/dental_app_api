import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { ClinicsModule } from '../clinics/clinics.module';
import { UsersModule } from '../users/users.module';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import {
  ScheduleException,
  ScheduleExceptionSchema,
} from './schemas/schedule-exception.schema';
import { WorkingHoursController } from './working-hours.controller';
import { WorkingHoursService } from './working-hours.service';

@Module({
  imports: [
    UsersModule,
    ClinicsModule,
    MongooseModule.forFeature([
      { name: ScheduleException.name, schema: ScheduleExceptionSchema },
    ]),
  ],
  controllers: [DoctorsController, WorkingHoursController],
  providers: [DoctorsService, WorkingHoursService],
  exports: [DoctorsService, WorkingHoursService],
})
export class DoctorsModule {}
