import { Body, Controller, Get, Patch } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BEARER_AUTH_NAME } from '../../common/constants/swagger.constants';
import { Roles } from '../../common/decorators/roles.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { ClinicsService } from './clinics.service';
import { ClinicResponseDto } from './dto/clinic-response.dto';
import { UpdateClinicDto } from './dto/update-clinic.dto';

@ApiTags('clinic')
@ApiBearerAuth(BEARER_AUTH_NAME)
@Controller('clinic')
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @ApiOperation({
    summary: 'Clinic profile plus scheduling constants clients need for local time display',
  })
  @ApiOkResponse({ type: ClinicResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  getClinic(): Promise<ClinicResponseDto> {
    return this.clinicsService.getClinicResponse();
  }

  @Patch()
  @Roles(UserRole.DOCTOR, UserRole.NURSE)
  @ApiOperation({
    summary: 'Update clinic name, timezone, or duration settings (staff only)',
  })
  @ApiOkResponse({ type: ClinicResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiForbiddenResponse({ type: ErrorResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  updateClinic(@Body() dto: UpdateClinicDto): Promise<ClinicResponseDto> {
    return this.clinicsService.updateClinic(dto);
  }
}
