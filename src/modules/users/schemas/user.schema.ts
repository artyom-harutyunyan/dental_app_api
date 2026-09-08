import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

import { UserRole } from '../../../common/enums/user-role.enum';
import { WorkingHoursEntry, WorkingHoursEntrySchema } from './working-hours.schema';

export type UserDocument = HydratedDocument<User>;

@Schema({
  timestamps: true,
  collection: 'users',
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: (_doc, ret: Record<string, unknown>) => {
      ret.id = String(ret._id);
      delete ret._id;
      delete ret.passwordHash;
      delete ret.__v;
      return ret;
    },
  },
})
export class User {
  @Prop({ type: String, required: true, trim: true, minlength: 2, maxlength: 100 })
  name!: string;

  @Prop({
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email!: string;

  @Prop({ type: String, default: null, trim: true })
  phone!: string | null;

  /** Null for walk-in patients created by staff mid-booking; they cannot log in until they register. */
  @Prop({ type: String, required: false, default: null, select: false })
  passwordHash!: string | null;

  @Prop({ type: String, required: true, enum: Object.values(UserRole) })
  role!: UserRole;

  @Prop({ type: Types.ObjectId, ref: 'Clinic', default: null })
  clinicId!: Types.ObjectId | null;

  @Prop({ type: Boolean, default: true })
  active!: boolean;

  @Prop({ type: [WorkingHoursEntrySchema], default: [] })
  workingHours!: WorkingHoursEntry[];

  createdAt!: Date;
  updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.index({ role: 1, active: 1 });
