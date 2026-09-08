import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { UserRole } from '../../common/enums/user-role.enum';
import { User, UserDocument } from './schemas/user.schema';
import { WorkingHoursEntry } from './schemas/working-hours.schema';

export interface CreateUserInput {
  name: string;
  email: string;
  phone: string | null;
  passwordHash: string | null;
  role: UserRole;
  clinicId?: Types.ObjectId | null;
  active?: boolean;
}

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(input: CreateUserInput): Promise<UserDocument> {
    const user = new this.userModel({
      name: input.name.trim(),
      email: input.email.toLowerCase().trim(),
      phone: input.phone,
      passwordHash: input.passwordHash,
      role: input.role,
      clinicId: input.clinicId ?? null,
      active: input.active ?? true,
      workingHours: [],
    });

    return user.save();
  }

  /**
   * Find a patient by phone. Walk-in booking reuses an existing record so the
   * same phone does not create duplicate patients.
   */
  async findPatientByPhone(phone: string): Promise<UserDocument | null> {
    const normalized = phone.trim();
    if (!normalized) {
      return null;
    }

    return this.userModel
      .findOne({ role: UserRole.PATIENT, phone: normalized })
      .exec();
  }

  /**
   * Create or reuse a lightweight patient for staff walk-in bookings.
   * No password — they can register later against the same phone.
   */
  async findOrCreateWalkInPatient(name: string, phone: string): Promise<UserDocument> {
    const normalizedPhone = phone.trim();
    const existing = await this.findPatientByPhone(normalizedPhone);
    if (existing) {
      return existing;
    }

    const digits = normalizedPhone.replace(/\D/g, '');
    const email = `walkin.${digits || Date.now()}@patients.local`;

    return this.create({
      name: name.trim(),
      email,
      phone: normalizedPhone,
      passwordHash: null,
      role: UserRole.PATIENT,
      clinicId: null,
      active: true,
    });
  }

  async findById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel.findById(id).exec();
  }

  async findByIdOrFail(id: string): Promise<UserDocument> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel
      .findOne({ email: email.toLowerCase().trim() })
      .select('+passwordHash')
      .exec();
  }

  async findActiveDoctors(): Promise<UserDocument[]> {
    return this.userModel
      .find({ role: UserRole.DOCTOR, active: true })
      .sort({ name: 1 })
      .exec();
  }

  async findActiveDoctorById(id: string): Promise<UserDocument | null> {
    if (!Types.ObjectId.isValid(id)) {
      return null;
    }

    return this.userModel
      .findOne({ _id: id, role: UserRole.DOCTOR, active: true })
      .exec();
  }

  async updateWorkingHours(
    doctorId: string,
    workingHours: WorkingHoursEntry[],
  ): Promise<UserDocument> {
    const doctor = await this.userModel
      .findOneAndUpdate(
        { _id: doctorId, role: UserRole.DOCTOR, active: true },
        { $set: { workingHours } },
        { new: true },
      )
      .exec();

    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }

    return doctor;
  }
}
