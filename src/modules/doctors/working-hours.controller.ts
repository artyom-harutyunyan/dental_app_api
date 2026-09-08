import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BEARER_AUTH_NAME } from '../../common/constants/swagger.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { CreateScheduleExceptionDto } from './dto/create-schedule-exception.dto';
import { ScheduleExceptionResponseDto } from './dto/schedule-exception-response.dto';
import { ScheduleExceptionsQueryDto } from './dto/schedule-exceptions-query.dto';
import { UpdateWorkingHoursDto } from './dto/update-working-hours.dto';
import { WorkingHoursResponseDto } from './dto/working-hours-response.dto';
import { WorkingHoursService } from './working-hours.service';

@ApiTags('doctors')
@ApiBearerAuth(BEARER_AUTH_NAME)
@Controller('doctors')
export class WorkingHoursController {
  constructor(private readonly workingHoursService: WorkingHoursService) {}

  @Get(':id/working-hours')
  @ApiOperation({
    summary: 'Weekly working hours for a doctor (minutes from clinic-local midnight)',
  })
  @ApiOkResponse({ type: WorkingHoursResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getWorkingHours(
    @Param('id', ParseObjectIdPipe) id: string,
  ): Promise<WorkingHoursResponseDto> {
    return this.workingHoursService.getWorkingHours(id);
  }

  @Put(':id/working-hours')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Replace the full weekly schedule for a doctor (staff only)',
  })
  @ApiOkResponse({ type: WorkingHoursResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  updateWorkingHours(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: UpdateWorkingHoursDto,
  ): Promise<WorkingHoursResponseDto> {
    return this.workingHoursService.updateWorkingHours(id, dto);
  }

  @Get(':id/schedule-exceptions')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'List per-date schedule overrides for a doctor (staff only)',
  })
  @ApiOkResponse({ type: ScheduleExceptionResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  listExceptions(
    @Param('id', ParseObjectIdPipe) id: string,
    @Query() query: ScheduleExceptionsQueryDto,
  ): Promise<ScheduleExceptionResponseDto[]> {
    return this.workingHoursService.listExceptions(id, query);
  }

  @Post(':id/schedule-exceptions')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create or replace a holiday / half-day override (staff only)',
  })
  @ApiCreatedResponse({ type: ScheduleExceptionResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  upsertException(
    @Param('id', ParseObjectIdPipe) id: string,
    @Body() dto: CreateScheduleExceptionDto,
  ): Promise<ScheduleExceptionResponseDto> {
    return this.workingHoursService.upsertException(id, dto);
  }

  @Delete(':id/schedule-exceptions/:exceptionId')
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove a schedule exception (staff only)',
  })
  @ApiNoContentResponse()
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  async deleteException(
    @Param('id', ParseObjectIdPipe) id: string,
    @Param('exceptionId', ParseObjectIdPipe) exceptionId: string,
  ): Promise<void> {
    await this.workingHoursService.deleteException(id, exceptionId);
  }
}
