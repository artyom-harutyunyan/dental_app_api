import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WorkingHoursEntryResponseDto {
  @ApiProperty({ example: 1 })
  weekday!: number;

  @ApiProperty({ example: false })
  isDayOff!: boolean;

  @ApiProperty({ example: 540, nullable: true })
  startMinute!: number | null;

  @ApiProperty({ example: 1080, nullable: true })
  endMinute!: number | null;

  @ApiProperty({ example: '09:00', nullable: true })
  startLabel!: string | null;

  @ApiProperty({ example: '18:00', nullable: true })
  endLabel!: string | null;
}

export class WorkingHoursResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  doctorId!: string;

  @ApiProperty({ example: 'Asia/Yerevan' })
  timezone!: string;

  @ApiProperty({ type: [WorkingHoursEntryResponseDto] })
  weekly!: WorkingHoursEntryResponseDto[];
}
