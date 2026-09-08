import { ApiProperty } from '@nestjs/swagger';

export class ClinicResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: 'Yerevan Dental Clinic' })
  name!: string;

  @ApiProperty({
    example: 'Asia/Yerevan',
    description: 'IANA timezone used to render all appointment times on clients.',
  })
  timezone!: string;

  @ApiProperty({ example: 15 })
  consultationDurationMinutes!: number;

  @ApiProperty({
    example: 90,
    description: 'Standard treatment length. Individual slots may be shorter when gap-filling.',
  })
  treatmentDurationMinutes!: number;

  @ApiProperty({
    example: 60,
    description: 'A treatment slot shorter than this is never offered.',
  })
  minTreatmentDurationMinutes!: number;

  @ApiProperty({
    example: 0,
    description: 'Gap enforced around every appointment. MVP default is 0.',
  })
  bufferMinutes!: number;
}
