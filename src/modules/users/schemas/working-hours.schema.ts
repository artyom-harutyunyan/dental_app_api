import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: false })
export class WorkingHoursEntry {
  @Prop({ type: Number, required: true, min: 0, max: 6 })
  weekday!: number;

  @Prop({ type: Number, default: null, min: 0, max: 1440 })
  startMinute!: number | null;

  @Prop({ type: Number, default: null, min: 0, max: 1440 })
  endMinute!: number | null;

  @Prop({ type: Boolean, required: true, default: true })
  isDayOff!: boolean;
}

export const WorkingHoursEntrySchema = SchemaFactory.createForClass(WorkingHoursEntry);
