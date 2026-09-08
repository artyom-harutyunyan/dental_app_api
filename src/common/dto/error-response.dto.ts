import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({ example: 'Conflict' })
  error!: string;

  @ApiProperty({
    example: 'This slot was just taken by someone else. Please pick another time.',
    description: 'Human-readable message. Conflict messages are safe to display to end users.',
  })
  message!: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['email must be an email'],
    description: 'Field-level validation failures. Present only on 400 responses.',
  })
  details?: string[];

  @ApiProperty({ example: '/api/v1/appointments' })
  path!: string;

  @ApiProperty({ example: '2026-09-08T09:15:00.000Z' })
  timestamp!: string;
}
