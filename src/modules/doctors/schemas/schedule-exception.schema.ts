import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ScheduleExceptionDocument = HydratedDocument<ScheduleException>;

@Schema({
  timestamps: true,
  collection: 'schedule_exceptions',
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
export class ScheduleException {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  doctorId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: Boolean, required: true })
  isDayOff!: boolean;

  @Prop({ type: Number, default: null, min: 0, max: 1440 })
  startMinute!: number | null;

  @Prop({ type: Number, default: null, min: 0, max: 1440 })
  endMinute!: number | null;

  @Prop({ type: String, default: null, trim: true })
  reason!: string | null;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ScheduleExceptionSchema = SchemaFactory.createForClass(ScheduleException);

ScheduleExceptionSchema.index({ doctorId: 1, date: 1 }, { unique: true });
