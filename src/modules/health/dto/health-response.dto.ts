import { ApiProperty } from '@nestjs/swagger';

export type DatabaseState = 'connected' | 'connecting' | 'disconnecting' | 'disconnected';

export class HealthResponseDto {
  @ApiProperty({ example: 'ok', enum: ['ok', 'degraded'] })
  status!: 'ok' | 'degraded';

  @ApiProperty({
    example: 'connected',
    enum: ['connected', 'connecting', 'disconnecting', 'disconnected'],
    description: 'Current Mongoose connection state.',
  })
  database!: DatabaseState;

  @ApiProperty({ example: '2026-09-08T09:15:00.000Z' })
  timestamp!: string;
}
