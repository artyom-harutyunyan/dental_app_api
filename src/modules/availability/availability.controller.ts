import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BEARER_AUTH_NAME } from '../../common/constants/swagger.constants';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AvailabilityService } from './availability.service';
import { AvailabilityQueryDto } from './dto/availability-query.dto';
import { AvailabilityResponseDto } from './dto/availability-response.dto';

@ApiTags('availability')
@ApiBearerAuth(BEARER_AUTH_NAME)
@Controller('doctors')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Get(':id/availability')
  @ApiOperation({
    summary:
      'Returns bookable slots for a doctor on a date, sized dynamically per slot',
    description:
      'Clients must render slot times using the clinic timezone from GET /clinic. Use each slot\'s durationMinutes — treatments are not always 90 minutes.',
  })
  @ApiOkResponse({ type: AvailabilityResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getAvailability(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: AvailabilityQueryDto,
  ): Promise<AvailabilityResponseDto> {
    return this.availabilityService.getAvailability(id, query.date, query.type);
  }
}
