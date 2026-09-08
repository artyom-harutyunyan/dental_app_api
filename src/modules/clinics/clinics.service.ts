import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IANAZone } from 'luxon';
import { Model } from 'mongoose';

import { Clinic, ClinicDocument } from './schemas/clinic.schema';
import { ClinicResponseDto } from './dto/clinic-response.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';
import { ClinicSchedulingSettings } from './interfaces/clinic-scheduling-settings.interface';

@Injectable()
export class ClinicsService {
  constructor(@InjectModel(Clinic.name) private readonly clinicModel: Model<ClinicDocument>) {}

  /**
   * Always load from Mongo. An in-memory document cache goes stale after
   * `npm run seed` (wipe + re-insert) and makes `clinic.save()` throw 500.
   */
  async getClinic(): Promise<ClinicDocument> {
    const clinic = await this.clinicModel.findOne().exec();
    if (!clinic) {
      throw new InternalServerErrorException(
        'No clinic document found. Run `npm run seed` to create the clinic.',
      );
    }

    return clinic;
  }

  async getSchedulingSettings(): Promise<ClinicSchedulingSettings> {
    const clinic = await this.getClinic();
    return {
      consultationDurationMinutes: clinic.consultationDurationMinutes,
      treatmentDurationMinutes: clinic.treatmentDurationMinutes,
      minTreatmentDurationMinutes: clinic.minTreatmentDurationMinutes,
      bufferMinutes: clinic.bufferMinutes,
    };
  }

  async getClinicResponse(): Promise<ClinicResponseDto> {
    return this.toResponse(await this.getClinic());
  }

  async updateClinic(dto: UpdateClinicDto): Promise<ClinicResponseDto> {
    const clinic = await this.getClinic();

    if (dto.timezone !== undefined && !IANAZone.isValidZone(dto.timezone)) {
      throw new BadRequestException(`timezone "${dto.timezone}" is not a valid IANA timezone`);
    }

    const nextTreatment =
      dto.treatmentDurationMinutes ?? clinic.treatmentDurationMinutes;
    const nextMinTreatment =
      dto.minTreatmentDurationMinutes ?? clinic.minTreatmentDurationMinutes;

    if (nextMinTreatment > nextTreatment) {
      throw new BadRequestException(
        `minTreatmentDurationMinutes (${nextMinTreatment}) must be less than or equal to treatmentDurationMinutes (${nextTreatment})`,
      );
    }

    if (dto.name !== undefined) {
      clinic.name = dto.name.trim();
    }
    if (dto.timezone !== undefined) {
      clinic.timezone = dto.timezone;
    }
    if (dto.consultationDurationMinutes !== undefined) {
      clinic.consultationDurationMinutes = dto.consultationDurationMinutes;
    }
    if (dto.treatmentDurationMinutes !== undefined) {
      clinic.treatmentDurationMinutes = dto.treatmentDurationMinutes;
    }
    if (dto.minTreatmentDurationMinutes !== undefined) {
      clinic.minTreatmentDurationMinutes = dto.minTreatmentDurationMinutes;
    }
    if (dto.bufferMinutes !== undefined) {
      clinic.bufferMinutes = dto.bufferMinutes;
    }

    await clinic.save();

    return this.toResponse(clinic);
  }

  private toResponse(clinic: ClinicDocument): ClinicResponseDto {
    return {
      id: clinic.id,
      name: clinic.name,
      timezone: clinic.timezone,
      consultationDurationMinutes: clinic.consultationDurationMinutes,
      treatmentDurationMinutes: clinic.treatmentDurationMinutes,
      minTreatmentDurationMinutes: clinic.minTreatmentDurationMinutes,
      bufferMinutes: clinic.bufferMinutes,
    };
  }
}
