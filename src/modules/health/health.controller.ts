import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Connection, ConnectionStates } from 'mongoose';

import { Public } from '../../common/decorators/public.decorator';
import { DatabaseState, HealthResponseDto } from './dto/health-response.dto';

const DATABASE_STATES: Record<number, DatabaseState> = {
  [ConnectionStates.disconnected]: 'disconnected',
  [ConnectionStates.connected]: 'connected',
  [ConnectionStates.connecting]: 'connecting',
  [ConnectionStates.disconnecting]: 'disconnecting',
};

@ApiTags('health')
@Public()
@Controller('health')
export class HealthController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reports whether the API is up and connected to MongoDB',
  })
  @ApiOkResponse({ type: HealthResponseDto })
  check(): HealthResponseDto {
    const database = DATABASE_STATES[this.connection.readyState] ?? 'disconnected';

    return {
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      timestamp: new Date().toISOString(),
    };
  }
}
