import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  addDaysToCalendarDate,
  isValidCalendarDate,
  localDateAndMinutesToUtc,
  minutesToLabel,
  todayInZone,
  weekdayInZone,
} from '../../common/utils/time.util';
import { ClinicsService } from '../clinics/clinics.service';
import { WorkingHoursEntry } from '../users/schemas/working-hours.schema';
import { UsersService } from '../users/users.service';
import { DoctorsService } from './doctors.service';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { ScheduleExceptionResponseDto } from './dto/schedule-exception-response.dto';
import { ScheduleExceptionsQueryDto } from './dto/schedule-exceptions-query.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { WorkingHoursEntryDto } from './dto/working-hours-entry.dto';
import {
  WorkingHoursEntryResponseDto,
  WorkingHoursResponseDto,
} from './dto/working-hours-response.dto';
import {
  ScheduleException,
  ScheduleExceptionDocument,
} from './schemas/schedule-exception.schema';

export interface WorkingWindow {
  start: Date;
  end: Date;
}

@Injectable()
export class WorkingHoursService {
  constructor(
    private readonly doctorsService: DoctorsService,
    private readonly usersService: UsersService,
    private readonly clinicsService: ClinicsService,
    @InjectModel(ScheduleException.name)
    private readonly exceptionModel: Model<ScheduleExceptionDocument>,
  ) {}

  async getWorkingHours(doctorId: string): Promise<WorkingHoursResponseDto> {
    const doctor = await this.doctorsService.findActiveDoctorOrFail(doctorId);
    const clinic = await this.clinicsService.getClinic();

    return {
      doctorId: doctor.id,
      timezone: clinic.timezone,
      weekly: this.normalizeWeeklyResponse(doctor.workingHours ?? []),
    };
  }

  async updateWorkingHours(
    doctorId: string,
    dto: UpdateWorkingHoursDto,
  ): Promise<WorkingHoursResponseDto> {
    await this.doctorsService.findActiveDoctorOrFail(doctorId);
    const clinic = await this.clinicsService.getClinic();
    const weekly = this.normalizeWeeklyInput(dto.weekly);
    const doctor = await this.usersService.updateWorkingHours(doctorId, weekly);

    return {
      doctorId: doctor.id,
      timezone: clinic.timezone,
      weekly: this.normalizeWeeklyResponse(doctor.workingHours ?? []),
    };
  }

  async listExceptions(
    doctorId: string,
    query: ScheduleExceptionsQueryDto,
  ): Promise<ScheduleExceptionResponseDto[]> {
    await this.doctorsService.findActiveDoctorOrFail(doctorId);
    const clinic = await this.clinicsService.getClinic();

    const from = query.from ?? todayInZone(clinic.timezone);
    const to = query.to ?? addDaysToCalendarDate(from, 90);

    this.assertValidDateParam(from, 'from');
    this.assertValidDateParam(to, 'to');

    if (from > to) {
      throw new BadRequestException('from must be on or before to');
    }

    const exceptions = await this.exceptionModel
      .find({
        doctorId: new Types.ObjectId(doctorId),
        date: { $gte: from, $lte: to },
      })
      .sort({ date: 1 })
      .exec();

    return exceptions.map((exception) => this.toExceptionResponse(exception));
  }

  async upsertException(
    doctorId: string,
    dto: CreateScheduleExceptionDto,
  ): Promise<ScheduleExceptionResponseDto> {
    await this.doctorsService.findActiveDoctorOrFail(doctorId);
    const clinic = await this.clinicsService.getClinic();

    this.assertValidDateParam(dto.date, 'date');

    const today = todayInZone(clinic.timezone);
    if (dto.date < today) {
      throw new BadRequestException('Cannot create an exception for a date in the past');
    }

    const window = this.normalizeExceptionWindow(dto);

    const exception = await this.exceptionModel
      .findOneAndUpdate(
        { doctorId: new Types.ObjectId(doctorId), date: dto.date },
        {
          $set: {
            isDayOff: dto.isDayOff,
            startMinute: window.startMinute,
            endMinute: window.endMinute,
            reason: dto.reason?.trim() || null,
          },
          $setOnInsert: {
            doctorId: new Types.ObjectId(doctorId),
            date: dto.date,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return this.toExceptionResponse(exception);
  }

  async deleteException(doctorId: string, exceptionId: string): Promise<void> {
    await this.doctorsService.findActiveDoctorOrFail(doctorId);

    if (!Types.ObjectId.isValid(exceptionId)) {
      throw new BadRequestException(`"${exceptionId}" is not a valid ObjectId`);
    }

    const result = await this.exceptionModel
      .findOneAndDelete({
        _id: exceptionId,
        doctorId: new Types.ObjectId(doctorId),
      })
      .exec();

    if (!result) {
      throw new NotFoundException('Schedule exception not found');
    }
  }

  /**
   * Resolves the doctor's bookable UTC window for a clinic-local calendar date.
   * Returns null when the doctor does not work that day.
   */
  async resolveWorkingWindow(
    doctorId: string,
    date: string,
  ): Promise<WorkingWindow | null> {
    this.assertValidDateParam(date, 'date');

    const doctor = await this.doctorsService.findActiveDoctorOrFail(doctorId);
    const clinic = await this.clinicsService.getClinic();
    const timezone = clinic.timezone;

    const exception = await this.exceptionModel
      .findOne({ doctorId: new Types.ObjectId(doctorId), date })
      .exec();

    let startMinute: number | null = null;
    let endMinute: number | null = null;

    if (exception) {
      if (exception.isDayOff) {
        return null;
      }

      if (exception.startMinute !== null && exception.endMinute !== null) {
        startMinute = exception.startMinute;
        endMinute = exception.endMinute;
      } else {
        const weekly = this.findWeeklyEntry(
          doctor.workingHours ?? [],
          weekdayInZone(date, timezone),
        );
        if (!weekly || weekly.isDayOff || weekly.startMinute === null || weekly.endMinute === null) {
          return null;
        }
        startMinute = weekly.startMinute;
        endMinute = weekly.endMinute;
      }
    } else {
      const weekly = this.findWeeklyEntry(
        doctor.workingHours ?? [],
        weekdayInZone(date, timezone),
      );
      if (!weekly || weekly.isDayOff || weekly.startMinute === null || weekly.endMinute === null) {
        return null;
      }
      startMinute = weekly.startMinute;
      endMinute = weekly.endMinute;
    }

    return {
      start: localDateAndMinutesToUtc(date, startMinute, timezone),
      end: localDateAndMinutesToUtc(date, endMinute, timezone),
    };
  }

  private normalizeWeeklyInput(weekly: WorkingHoursEntryDto[]): WorkingHoursEntry[] {
    if (weekly.length !== 7) {
      throw new BadRequestException('weekly must contain exactly seven entries, one per weekday');
    }

    const seen = new Set<number>();
    const normalized: WorkingHoursEntry[] = [];

    for (const entry of weekly) {
      if (seen.has(entry.weekday)) {
        throw new BadRequestException(`Duplicate weekday ${entry.weekday} in working hours`);
      }
      seen.add(entry.weekday);

      if (entry.isDayOff) {
        normalized.push({
          weekday: entry.weekday,
          isDayOff: true,
          startMinute: null,
          endMinute: null,
        });
        continue;
      }

      if (entry.startMinute === null || entry.startMinute === undefined) {
        throw new BadRequestException(
          `weekday ${entry.weekday}: startMinute is required when isDayOff is false`,
        );
      }
      if (entry.endMinute === null || entry.endMinute === undefined) {
        throw new BadRequestException(
          `weekday ${entry.weekday}: endMinute is required when isDayOff is false`,
        );
      }
      if (entry.endMinute <= entry.startMinute) {
        throw new BadRequestException(
          `weekday ${entry.weekday}: endMinute (${entry.endMinute}) must be greater than startMinute (${entry.startMinute})`,
        );
      }

      normalized.push({
        weekday: entry.weekday,
        isDayOff: false,
        startMinute: entry.startMinute,
        endMinute: entry.endMinute,
      });
    }

    for (let weekday = 0; weekday <= 6; weekday += 1) {
      if (!seen.has(weekday)) {
        throw new BadRequestException(
          `weekly is missing weekday ${weekday}; provide exactly one entry per weekday 0–6`,
        );
      }
    }

    return normalized.sort((a, b) => a.weekday - b.weekday);
  }

  private normalizeWeeklyResponse(
    stored: WorkingHoursEntry[],
  ): WorkingHoursEntryResponseDto[] {
    const byWeekday = new Map(stored.map((entry) => [entry.weekday, entry]));

    return Array.from({ length: 7 }, (_, weekday) => {
      const entry = byWeekday.get(weekday);
      if (!entry || entry.isDayOff) {
        return {
          weekday,
          isDayOff: true,
          startMinute: null,
          endMinute: null,
          startLabel: null,
          endLabel: null,
        };
      }

      return {
        weekday,
        isDayOff: false,
        startMinute: entry.startMinute,
        endMinute: entry.endMinute,
        startLabel:
          entry.startMinute === null ? null : minutesToLabel(entry.startMinute),
        endLabel: entry.endMinute === null ? null : minutesToLabel(entry.endMinute),
      };
    });
  }

  private normalizeExceptionWindow(dto: CreateScheduleExceptionDto): {
    startMinute: number | null;
    endMinute: number | null;
  } {
    if (dto.isDayOff) {
      return { startMinute: null, endMinute: null };
    }

    const startMinute = dto.startMinute ?? null;
    const endMinute = dto.endMinute ?? null;

    if (startMinute === null && endMinute === null) {
      return { startMinute: null, endMinute: null };
    }

    if (startMinute === null || endMinute === null) {
      throw new BadRequestException(
        'Both startMinute and endMinute must be provided together when overriding hours',
      );
    }

    if (endMinute <= startMinute) {
      throw new BadRequestException(
        `endMinute (${endMinute}) must be greater than startMinute (${startMinute})`,
      );
    }

    return { startMinute, endMinute };
  }

  private findWeeklyEntry(
    workingHours: WorkingHoursEntry[],
    weekday: number,
  ): WorkingHoursEntry | undefined {
    return workingHours.find((entry) => entry.weekday === weekday);
  }

  private assertValidDateParam(date: string, field: string): void {
    if (!isValidCalendarDate(date)) {
      throw new BadRequestException(`${field} must be a valid calendar date (YYYY-MM-DD)`);
    }
  }

  private toExceptionResponse(
    exception: ScheduleExceptionDocument,
  ): ScheduleExceptionResponseDto {
    return {
      id: exception.id,
      doctorId: String(exception.doctorId),
      date: exception.date,
      isDayOff: exception.isDayOff,
      startMinute: exception.startMinute,
      endMinute: exception.endMinute,
      reason: exception.reason,
    };
  }
}
