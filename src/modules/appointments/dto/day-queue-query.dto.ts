import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString, Matches } from 'class-validator';

import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';

export class DayQueueQueryDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  @IsMongoId()
  doctorId!: string;

  @ApiProperty({
    example: '2026-09-15',
    description: 'Clinic-local calendar date YYYY-MM-DD',
  })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @ApiPropertyOptional({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    description: 'When omitted, includes all statuses (including cancelled)',
  })
  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;
}
