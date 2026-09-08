import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AppointmentType } from '../../common/enums/appointment-type.enum';
import {
  addDaysToCalendarDate,
  isValidCalendarDate,
  todayInZone,
} from '../../common/utils/time.util';
import { AppointmentsQueryService } from '../appointments/appointments-query.service';
import { ClinicsService } from '../clinics/clinics.service';
import { DoctorsService } from '../doctors/doctors.service';
import { WorkingHoursService } from '../doctors/working-hours.service';
import { AvailabilityResponseDto } from './dto/availability-response.dto';
import { SlotResponseDto } from './dto/slot-response.dto';
import { SlotCalculatorService } from './slot-calculator.service';

@Injectable()
export class AvailabilityService {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly clinicsService: ClinicsService,
    private readonly workingHoursService: WorkingHoursService,
    private readonly appointmentsQuery: AppointmentsQueryService,
    private readonly slotCalculator: SlotCalculatorService,
    private readonly config: ConfigService,
  ) {}

  async getAvailability(
    doctorId: string,
    date: string,
    type: AppointmentType,
    now: Date = new Date(),
  ): Promise<AvailabilityResponseDto> {
    if (!isValidCalendarDate(date)) {
      throw new BadRequestException('date must be a valid calendar date (YYYY-MM-DD)');
    }

    await this.doctorsService.findActiveDoctorOrFail(doctorId);

    const clinic = await this.clinicsService.getClinic();
    const settings = await this.clinicsService.getSchedulingSettings();
    const timezone = clinic.timezone;

    const today = todayInZone(timezone);
    const horizonDays = this.config.getOrThrow<number>('booking.availabilityHorizonDays');
    const maxDate = addDaysToCalendarDate(today, horizonDays);

    if (date < today) {
      throw new BadRequestException('date cannot be in the past');
    }
    if (date > maxDate) {
      throw new BadRequestException(
        `date cannot be more than ${horizonDays} days ahead`,
      );
    }

    const window = await this.workingHoursService.resolveWorkingWindow(doctorId, date);

    if (!window) {
      return {
        doctorId,
        date,
        type,
        timezone,
        isWorkingDay: false,
        slots: [],
      };
    }

    const busy = await this.appointmentsQuery.findBusyOverlappingWindow(
      doctorId,
      window.start,
      window.end,
    );

    const slots = this.slotCalculator.computeSlots({
      window,
      busy,
      settings,
      type,
    });

    const leadTimeMinutes = this.config.getOrThrow<number>('booking.leadTimeMinutes');
    const earliestStartMs = now.getTime() + leadTimeMinutes * 60_000;

    const filtered = slots.filter((slot) => slot.start.getTime() >= earliestStartMs);

    return {
      doctorId,
      date,
      type,
      timezone,
      isWorkingDay: true,
      slots: filtered.map((slot): SlotResponseDto => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
        durationMinutes: slot.durationMinutes,
        type: slot.type,
      })),
    };
  }
}
