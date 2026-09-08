import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { AppointmentStatus } from '../../common/enums/appointment-status.enum';
import { AppointmentType } from '../../common/enums/appointment-type.enum';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

export interface BookedBusyInterval {
  start: Date;
  end: Date;
  type: AppointmentType;
}

/**
 * Read-only appointment queries for availability (and later the day queue).
 * Kept separate so AvailabilityModule can import this without a circular CRUD dependency.
 */
@Injectable()
export class AppointmentsQueryService {
  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<AppointmentDocument>,
  ) {}

  async findBusyOverlappingWindow(
    doctorId: string,
    windowStart: Date,
    windowEnd: Date,
  ): Promise<BookedBusyInterval[]> {
    const appointments = await this.appointmentModel
      .find({
        doctorId: new Types.ObjectId(doctorId),
        status: AppointmentStatus.BOOKED,
        startTime: { $lt: windowEnd },
        endTime: { $gt: windowStart },
      })
      .select({ startTime: 1, endTime: 1, type: 1 })
      .lean()
      .exec();

    return appointments.map((appointment) => ({
      start: appointment.startTime,
      end: appointment.endTime,
      type: appointment.type,
    }));
  }
}
