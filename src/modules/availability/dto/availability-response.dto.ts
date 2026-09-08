import { ApiProperty } from '@nestjs/swagger';

import { AppointmentType } from '../../../common/enums/appointment-type.enum';
import { SlotResponseDto } from './slot-response.dto';

export class AvailabilityResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  doctorId!: string;

  @ApiProperty({ example: '2026-09-15' })
  date!: string;

  @ApiProperty({
    enum: AppointmentType,
    enumName: 'AppointmentType',
    example: AppointmentType.TREATMENT,
  })
  type!: AppointmentType;

  @ApiProperty({ example: 'Asia/Yerevan' })
  timezone!: string;

  @ApiProperty({
    example: true,
    description:
      'False when the doctor does not work that day. True with an empty slots array means the day is fully booked. Clients should show different empty states for each case.',
  })
  isWorkingDay!: boolean;

  @ApiProperty({ type: [SlotResponseDto] })
  slots!: SlotResponseDto[];
}
