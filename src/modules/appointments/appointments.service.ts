import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { UserRole, isStaffRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../../common/interfaces/authenticated-request.interface';
import {
  addDaysToCalendarDate,
  isValidCalendarDate,
  localDateAndMinutesToUtc,
  utcToLocalDate,
} from '../../common/utils/time.util';
import { AvailabilityService } from '../availability/availability.service';
import { ClinicsService } from '../clinics/clinics.service';
import { DoctorsService } from '../doctors/doctors.service';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import {
  AppointmentResponseDto,
  MyAppointmentsResponseDto,
} from './dto/appointment-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

export const SLOT_CONFLICT_MESSAGE =
  'This slot was just taken by someone else. Please pick another time.';

@Injectable()
export class AppointmentsService implements OnModuleInit {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
    private readonly availabilityService: AvailabilityService,
    private readonly clinicsService: ClinicsService,
    private readonly doctorsService: DoctorsService,
    private readonly usersService: UsersService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Ensure the partial unique index exists even when autoIndex is disabled.
    await this.appointmentModel.syncIndexes();
  }

  async create(
    dto: CreateAppointmentDto,
    caller: JwtPayload,
  ): Promise<AppointmentResponseDto> {
    const doctor = await this.doctorsService.findActiveDoctorOrFail(dto.doctorId);
    const clinic = await this.clinicsService.getClinic();

    const patient = await this.resolvePatient(dto, caller);
    const startTime = new Date(dto.startTime);
    const localDate = utcToLocalDate(startTime, clinic.timezone);

    const availability = await this.availabilityService.getAvailability(
      dto.doctorId,
      localDate,
      dto.type,
    );

    const requestedStartIso = startTime.toISOString();
    const matchedSlot = availability.slots.find(
      (slot) => slot.start === requestedStartIso && slot.type === dto.type,
    );

    if (!matchedSlot) {
      throw new ConflictException(SLOT_CONFLICT_MESSAGE);
    }

    const endTime = new Date(matchedSlot.end);
    const durationMinutes = matchedSlot.durationMinutes;
    const createdBy: 'patient' | 'staff' = isStaffRole(caller.role)
      ? 'staff'
      : 'patient';

    let created: AppointmentDocument;
    try {
      created = await this.appointmentModel.create({
        clinicId: clinic._id,
        doctorId: new Types.ObjectId(dto.doctorId),
        patientId: new Types.ObjectId(patient.id),
        type: dto.type,
        startTime,
        endTime,
        durationMinutes,
        status: AppointmentStatus.BOOKED,
        createdBy,
        createdById: new Types.ObjectId(caller.sub),
        notes: dto.notes?.trim() || null,
      });
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException(SLOT_CONFLICT_MESSAGE);
      }
      throw error;
    }

    await this.resolvePostInsertOverlap(created);

    return this.toResponse(created, doctor, patient, {
      includePatient: isStaffRole(caller.role),
    });
  }

  async getDayQueue(
    doctorId: string,
    date: string,
    status?: AppointmentStatus,
  ): Promise<AppointmentResponseDto[]> {
    if (!isValidCalendarDate(date)) {
      throw new BadRequestException('date must be a valid calendar date (YYYY-MM-DD)');
    }

    await this.doctorsService.findActiveDoctorOrFail(doctorId);
    const clinic = await this.clinicsService.getClinic();
    const timezone = clinic.timezone;

    const windowStart = localDateAndMinutesToUtc(date, 0, timezone);
    const windowEnd = localDateAndMinutesToUtc(addDaysToCalendarDate(date, 1), 0, timezone);

    const filter: Record<string, unknown> = {
      doctorId: new Types.ObjectId(doctorId),
      startTime: { $lt: windowEnd },
      endTime: { $gt: windowStart },
    };

    if (status !== undefined) {
      filter.status = status;
    }

    const appointments = await this.appointmentModel
      .find(filter)
      .sort({ startTime: 1 })
      .exec();

    return this.mapWithParticipants(appointments, { includePatient: true });
  }

  async getMine(patientId: string): Promise<MyAppointmentsResponseDto> {
    const now = new Date();
    const appointments = await this.appointmentModel
      .find({ patientId: new Types.ObjectId(patientId) })
      .sort({ startTime: -1 })
      .exec();

    const mapped = await this.mapWithParticipants(appointments, {
      includePatient: false,
    });

    const upcoming: AppointmentResponseDto[] = [];
    const past: AppointmentResponseDto[] = [];

    for (const appointment of mapped) {
      const isUpcoming =
        appointment.status === AppointmentStatus.BOOKED &&
        new Date(appointment.startTime).getTime() >= now.getTime();

      if (isUpcoming) {
        upcoming.push(appointment);
      } else {
        past.push(appointment);
      }
    }

    upcoming.sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    past.sort(
      (a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );

    return { upcoming, past };
  }

  async getById(id: string, caller: JwtPayload): Promise<AppointmentResponseDto> {
    const appointment = await this.findByIdOrFail(id);

    if (caller.role === UserRole.PATIENT && String(appointment.patientId) !== caller.sub) {
      throw new NotFoundException('Appointment not found');
    }

    const [doctor, patient] = await Promise.all([
      this.usersService.findByIdOrFail(String(appointment.doctorId)),
      this.usersService.findByIdOrFail(String(appointment.patientId)),
    ]);

    return this.toResponse(appointment, doctor, patient, {
      includePatient: isStaffRole(caller.role),
    });
  }

  async cancel(id: string, caller: JwtPayload): Promise<AppointmentResponseDto> {
    const appointment = await this.findByIdOrFail(id);

    if (caller.role === UserRole.PATIENT && String(appointment.patientId) !== caller.sub) {
      throw new NotFoundException('Appointment not found');
    }

    if (appointment.status === AppointmentStatus.CANCELLED) {
      const [doctor, patient] = await Promise.all([
        this.usersService.findByIdOrFail(String(appointment.doctorId)),
        this.usersService.findByIdOrFail(String(appointment.patientId)),
      ]);
      return this.toResponse(appointment, doctor, patient, {
        includePatient: isStaffRole(caller.role),
      });
    }

    if (
      caller.role === UserRole.PATIENT &&
      appointment.startTime.getTime() <= Date.now()
    ) {
      throw new BadRequestException('Cannot cancel an appointment that has already started');
    }

    appointment.status = AppointmentStatus.CANCELLED;
    await appointment.save();

    const [doctor, patient] = await Promise.all([
      this.usersService.findByIdOrFail(String(appointment.doctorId)),
      this.usersService.findByIdOrFail(String(appointment.patientId)),
    ]);

    return this.toResponse(appointment, doctor, patient, {
      includePatient: isStaffRole(caller.role),
    });
  }

  private async resolvePatient(
    dto: CreateAppointmentDto,
    caller: JwtPayload,
  ): Promise<UserDocument> {
    if (caller.role === UserRole.PATIENT) {
      return this.usersService.findByIdOrFail(caller.sub);
    }

    if (dto.patientId) {
      const patient = await this.usersService.findByIdOrFail(dto.patientId);
      if (patient.role !== UserRole.PATIENT) {
        throw new BadRequestException('patientId must refer to a patient user');
      }
      return patient;
    }

    if (dto.patientName && dto.patientPhone) {
      return this.usersService.findOrCreateWalkInPatient(
        dto.patientName,
        dto.patientPhone,
      );
    }

    throw new BadRequestException(
      'Staff must provide patientId, or both patientName and patientPhone for a walk-in',
    );
  }

  /**
   * Layer 3: unique index only covers identical start times. After insert, if
   * another booked appointment overlaps, the newer _id deletes itself.
   */
  private async resolvePostInsertOverlap(created: AppointmentDocument): Promise<void> {
    const overlaps = await this.appointmentModel
      .find({
        doctorId: created.doctorId,
        status: AppointmentStatus.BOOKED,
        startTime: { $lt: created.endTime },
        endTime: { $gt: created.startTime },
      })
      .select({ _id: 1 })
      .lean()
      .exec();

    const createdId = String(created._id);
    const isLoser = overlaps.some(
      (other) => String(other._id) !== createdId && createdId > String(other._id),
    );

    if (isLoser) {
      await this.appointmentModel.deleteOne({ _id: created._id }).exec();
      throw new ConflictException(SLOT_CONFLICT_MESSAGE);
    }
  }

  private async findByIdOrFail(id: string): Promise<AppointmentDocument> {
    if (!Types.ObjectId.isValid(id)) {
      throw new NotFoundException('Appointment not found');
    }

    const appointment = await this.appointmentModel.findById(id).exec();
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  private async mapWithParticipants(
    appointments: AppointmentDocument[],
    options: { includePatient: boolean },
  ): Promise<AppointmentResponseDto[]> {
    if (appointments.length === 0) {
      return [];
    }

    const userIds = new Set<string>();
    for (const appointment of appointments) {
      userIds.add(String(appointment.doctorId));
      userIds.add(String(appointment.patientId));
    }

    const users = await Promise.all(
      [...userIds].map((id) => this.usersService.findById(id)),
    );
    const usersById = new Map<string, UserDocument>();
    for (const user of users) {
      if (user) {
        usersById.set(user.id, user);
      }
    }

    return appointments.map((appointment) => {
      const doctor = usersById.get(String(appointment.doctorId));
      const patient = usersById.get(String(appointment.patientId));
      if (!doctor || !patient) {
        throw new NotFoundException('Appointment participant not found');
      }
      return this.toResponse(appointment, doctor, patient, options);
    });
  }

  private toResponse(
    appointment: AppointmentDocument,
    doctor: UserDocument,
    patient: UserDocument,
    options: { includePatient: boolean },
  ): AppointmentResponseDto {
    const response: AppointmentResponseDto = {
      id: appointment.id,
      doctorId: String(appointment.doctorId),
      doctor: {
        id: doctor.id,
        name: doctor.name,
      },
      patientId: String(appointment.patientId),
      type: appointment.type,
      startTime: appointment.startTime.toISOString(),
      endTime: appointment.endTime.toISOString(),
      durationMinutes: appointment.durationMinutes,
      status: appointment.status,
      createdBy: appointment.createdBy,
      notes: appointment.notes,
    };

    if (options.includePatient) {
      response.patient = {
        id: patient.id,
        name: patient.name,
        phone: patient.phone,
      };
    }

    return response;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}
