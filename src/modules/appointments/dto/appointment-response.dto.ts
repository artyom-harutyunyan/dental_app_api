import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AppointmentStatus } from '../../../common/enums/appointment-status.enum';
import { AppointmentType } from '../../../common/enums/appointment-type.enum';

export class AppointmentDoctorDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  id!: string;

  @ApiProperty({ example: 'Dr. Ani Hakobyan' })
  name!: string;
}

export class AppointmentPatientDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0e' })
  id!: string;

  @ApiProperty({ example: 'Anna Petrosyan' })
  name!: string;

  @ApiProperty({ example: '+37499111222', nullable: true })
  phone!: string | null;
}

export class AppointmentResponseDto {
  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0f' })
  id!: string;

  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0d' })
  doctorId!: string;

  @ApiProperty({ type: AppointmentDoctorDto })
  doctor!: AppointmentDoctorDto;

  @ApiProperty({ example: '652f1a2b3c4d5e6f7a8b9c0e' })
  patientId!: string;

  @ApiPropertyOptional({
    type: AppointmentPatientDto,
    description: 'Omitted from patient-facing responses',
  })
  patient?: AppointmentPatientDto;

  @ApiProperty({
    enum: AppointmentType,
    enumName: 'AppointmentType',
    example: AppointmentType.CONSULTATION,
  })
  type!: AppointmentType;

  @ApiProperty({
    example: '2026-09-15T05:00:00.000Z',
    description:
      'UTC ISO-8601 start instant. Render in the clinic timezone from GET /clinic.',
  })
  startTime!: string;

  @ApiProperty({
    example: '2026-09-15T05:15:00.000Z',
    description:
      'UTC ISO-8601 end instant. Render in the clinic timezone from GET /clinic.',
  })
  endTime!: string;

  @ApiProperty({
    example: 15,
    description:
      'Stored duration for this appointment. Authoritative — treatments are not always 90 minutes.',
  })
  durationMinutes!: number;

  @ApiProperty({
    enum: AppointmentStatus,
    enumName: 'AppointmentStatus',
    example: AppointmentStatus.BOOKED,
  })
  status!: AppointmentStatus;

  @ApiProperty({
    enum: ['patient', 'staff'],
    enumName: 'AppointmentCreatedBy',
    example: 'patient',
  })
  createdBy!: 'patient' | 'staff';

  @ApiProperty({ example: 'Sensitive to cold', nullable: true })
  notes!: string | null;
}

export class MyAppointmentsResponseDto {
  @ApiProperty({ type: [AppointmentResponseDto] })
  upcoming!: AppointmentResponseDto[];

  @ApiProperty({ type: [AppointmentResponseDto] })
  past!: AppointmentResponseDto[];
}
