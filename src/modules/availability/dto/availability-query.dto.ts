import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, Matches } from 'class-validator';

import { AppointmentType } from '../../../common/enums/appointment-type.enum';

export class AvailabilityQueryDto {
  @ApiProperty({ example: '2026-09-15', description: 'Clinic-local calendar date YYYY-MM-DD' })
  @IsString()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'date must be YYYY-MM-DD' })
  date!: string;

  @ApiProperty({
    enum: AppointmentType,
    enumName: 'AppointmentType',
    example: AppointmentType.TREATMENT,
  })
  @IsEnum(AppointmentType)
  type!: AppointmentType;
}
