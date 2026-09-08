import { ApiProperty } from '@nestjs/swagger';

export class ScheduleExceptionResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0e' })
  doctorId!: string;

  @ApiProperty({ example: '2026-09-15' })
  date!: string;

  @ApiProperty({ example: true })
  isDayOff!: boolean;

  @ApiProperty({ example: null, nullable: true })
  startMinute!: number | null;

  @ApiProperty({ example: null, nullable: true })
  endMinute!: number | null;

  @ApiProperty({ example: 'Public holiday', nullable: true })
  reason!: string | null;
}
