import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ClinicDocument = HydratedDocument<Clinic>;

@Schema({
  timestamps: true,
  collection: 'clinics',
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
export class Clinic {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, required: true, default: 'Asia/Yerevan' })
  timezone!: string;

  @Prop({ type: Number, required: true, default: 15, min: 1 })
  consultationDurationMinutes!: number;

  @Prop({ type: Number, required: true, default: 90, min: 1 })
  treatmentDurationMinutes!: number;

  @Prop({ type: Number, required: true, default: 60, min: 1 })
  minTreatmentDurationMinutes!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  bufferMinutes!: number;

  createdAt!: Date;
  updatedAt!: Date;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);
