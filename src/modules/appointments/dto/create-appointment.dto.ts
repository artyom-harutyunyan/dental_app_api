import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';

import { AppointmentType } from '../../../common/enums/appointment-type.enum';

export class CreateAppointmentDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  @IsMongoId()
  doctorId!: string;

  @ApiProperty({
    enum: AppointmentType,
    enumName: 'AppointmentType',
    example: AppointmentType.CONSULTATION,
  })
  @IsEnum(AppointmentType)
  type!: AppointmentType;

  @ApiProperty({
    example: '2026-09-15T05:00:00.000Z',
    description:
      'UTC ISO-8601 start of an offered availability slot (copy `slots[].start` verbatim). Clients must render local time using the clinic timezone from GET /clinic; do not send endTime — the server derives it from the matched slot.',
  })
  @Type(() => Date)
  @IsDate()
  startTime!: Date;

  @ApiPropertyOptional({ example: 'Sensitive to cold', nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string | null;

  @ApiPropertyOptional({
    example: '652f1a2b3c4d5e6f7a8b9c0e',
    description: 'Existing patient id (staff only; ignored for patient callers)',
  })
  @IsOptional()
  @IsMongoId()
  patientId?: string;

  @ApiPropertyOptional({
    example: 'Karen Sargsyan',
    description: 'Walk-in patient name (staff only; required with patientPhone when patientId is omitted)',
  })
  @ValidateIf(
    (dto: CreateAppointmentDto) =>
      dto.patientId === undefined && dto.patientPhone !== undefined,
  )
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  patientName?: string;

  @ApiPropertyOptional({
    example: '+37499111222',
    description: 'Walk-in patient phone (staff only; required with patientName when patientId is omitted)',
  })
  @ValidateIf(
    (dto: CreateAppointmentDto) =>
      dto.patientId === undefined && dto.patientName !== undefined,
  )
  @IsString()
  @Matches(/^\+?[0-9\s\-()]{7,20}$/, {
    message: 'patientPhone must be a valid phone number',
  })
  patientPhone?: string;
}
