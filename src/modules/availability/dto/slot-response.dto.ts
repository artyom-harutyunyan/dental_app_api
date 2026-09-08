import { ApiProperty } from '@nestjs/swagger';

import { AppointmentType } from '../../../common/enums/appointment-type.enum';

export class SlotResponseDto {
  @ApiProperty({
    example: '2026-09-15T07:00:00.000Z',
    description:
      'UTC ISO-8601 start instant (Z suffix). Render in the clinic timezone from GET /clinic — never assume a fixed offset.',
  })
  start!: string;

  @ApiProperty({
    example: '2026-09-15T08:15:00.000Z',
    description:
      'UTC ISO-8601 end instant (Z suffix). Render in the clinic timezone from GET /clinic.',
  })
  end!: string;

  @ApiProperty({
    example: 75,
    description:
      'Duration for THIS slot only — authoritative. Treatments are not always 90 minutes; gap-fill slots may be shorter. Clients must never hardcode treatment duration.',
  })
  durationMinutes!: number;

  @ApiProperty({
    enum: AppointmentType,
    enumName: 'AppointmentType',
    example: AppointmentType.TREATMENT,
  })
  type!: AppointmentType;
}
