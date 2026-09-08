import { Module, forwardRef } from '@nestjs/common';

import { AppointmentsModule } from '../appointments/appointments.module';
import { ClinicsModule } from '../clinics/clinics.module';
import { DoctorsModule } from '../doctors/doctors.module';
import { AvailabilityController } from './availability.controller';
import { AvailabilityService } from './availability.service';
import { SlotCalculatorService } from './slot-calculator.service';

@Module({
  imports: [DoctorsModule, ClinicsModule, forwardRef(() => AppointmentsModule)],
  controllers: [AvailabilityController],
  providers: [AvailabilityService, SlotCalculatorService],
  exports: [AvailabilityService, SlotCalculatorService],
})
export class AvailabilityModule {}
