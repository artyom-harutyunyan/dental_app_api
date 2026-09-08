import { Injectable, NotFoundException } from '@nestjs/common';

import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { DoctorResponseDto } from './dto/doctor-response.dto';

@Injectable()
export class DoctorsService {
  constructor(private readonly usersService: UsersService) {}

  async listActiveDoctors(): Promise<DoctorResponseDto[]> {
    const doctors = await this.usersService.findActiveDoctors();
    return doctors.map((doctor) => this.toResponse(doctor));
  }

  async getActiveDoctor(id: string): Promise<DoctorResponseDto> {
    const doctor = await this.findActiveDoctorOrFail(id);
    return this.toResponse(doctor);
  }

  async findActiveDoctorOrFail(id: string): Promise<UserDocument> {
    const doctor = await this.usersService.findActiveDoctorById(id);
    if (!doctor) {
      throw new NotFoundException('Doctor not found');
    }
    return doctor;
  }

  private toResponse(doctor: UserDocument): DoctorResponseDto {
    return {
      id: doctor.id,
      name: doctor.name,
    };
  }
}
