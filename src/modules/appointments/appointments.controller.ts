import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Body,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
} from '@nestjs/swagger';

import { BEARER_AUTH_NAME } from '../../common/constants/swagger.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../../common/interfaces/authenticated-request.interface';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { AppointmentsService } from './appointments.service';
import {
  AppointmentResponseDto,
  MyAppointmentsResponseDto,
} from './dto/appointment-response.dto';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { DayQueueQueryDto } from './dto/day-queue-query.dto';

@ApiTags('appointments')
@ApiBearerAuth(BEARER_AUTH_NAME)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Book a slot; endTime is derived server-side from availability',
    description:
      'Patients book for themselves (body patientId is ignored). Staff pass patientId or walk-in patientName + patientPhone. Concurrent conflicts return 409 with a patient-safe message.',
  })
  @ApiCreatedResponse({ type: AppointmentResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description:
      'Slot not offered or taken concurrently — message is safe to show to patients',
  })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  create(
    @Body() dto: CreateAppointmentDto,
    @CurrentUser() user: JwtPayload,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.create(dto, user);
  }

  @Get()
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: "Staff day queue for a doctor's clinic-local calendar date",
    description:
      'Includes cancelled appointments by default so staff can see what changed. Each item embeds patient name and phone.',
  })
  @ApiOkResponse({ type: [AppointmentResponseDto] })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getDayQueue(@Query() query: DayQueueQueryDto): Promise<AppointmentResponseDto[]> {
    return this.appointmentsService.getDayQueue(
      query.doctorId,
      query.date,
      query.status,
    );
  }

  @Get('mine')
  @Roles(UserRole.PATIENT)
  @ApiOperation({
    summary: 'Upcoming and past appointments for the authenticated patient',
    description:
      'Upcoming is booked with startTime >= now (ascending). Past is everything else (descending). Doctor name is embedded.',
  })
  @ApiOkResponse({ type: MyAppointmentsResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  getMine(@CurrentUser() user: JwtPayload): Promise<MyAppointmentsResponseDto> {
    return this.appointmentsService.getMine(user.sub);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Fetch one appointment by id',
    description:
      'Patients may only read their own; another patient\'s id returns 404 (not 403).',
  })
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getById(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.getById(id, user);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Soft-cancel a booking (frees the slot immediately)',
    description:
      'Sets status to cancelled; idempotent on repeat. Patients cannot cancel another patient\'s booking (404) or one that has already started (400). Staff may cancel any.',
  })
  @ApiOkResponse({ type: AppointmentResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  cancel(
    @Param('id', ParseObjectIdPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ): Promise<AppointmentResponseDto> {
    return this.appointmentsService.cancel(id, user);
  }
}
