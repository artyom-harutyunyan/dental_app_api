import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AppointmentType } from '../../../common/enums/appointment-type.enum';

export type AppointmentDocument = HydratedDocument<Appointment>;

@Schema({
  timestamps: true,
  collection: 'appointments',
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.__v;
      return ret;
    },
  },
})
export class Appointment {
  @Prop({ type: Types.ObjectId, ref: 'Clinic', required: true })
  clinicId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  patientId!: Types.ObjectId;

  @Prop({ type: String, required: true, enum: Object.values(AppointmentType) })
  type!: AppointmentType;

  @Prop({ type: Date, required: true })
  startTime!: Date;

  @Prop({ type: Date, required: true })
  endTime!: Date;

  @Prop({ type: Number, required: true, min: 1 })
  durationMinutes!: number;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AppointmentStatus),
    default: AppointmentStatus.BOOKED,
  })
  status!: AppointmentStatus;

  @Prop({ type: String, required: true, enum: ['patient', 'staff'] })
  createdBy!: 'patient' | 'staff';

  @Prop({ type: Types.ObjectId, required: true })
  createdById!: Types.ObjectId;

  @Prop({ type: String, default: null })
  notes!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);

AppointmentSchema.index(
  { doctorId: 1, startTime: 1 },
  { unique: true, partialFilterExpression: { status: AppointmentStatus.BOOKED } },
);
AppointmentSchema.index({ doctorId: 1, startTime: 1, status: 1 });
AppointmentSchema.index({ patientId: 1, startTime: -1 });
