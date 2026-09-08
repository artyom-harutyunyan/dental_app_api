import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BEARER_AUTH_NAME } from '../../common/constants/swagger.constants';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { ParseObjectIdPipe } from '../../common/pipes/parse-object-id.pipe';
import { DoctorsService } from './doctors.service';
import { DoctorResponseDto } from './dto/doctor-response.dto';

@ApiTags('doctors')
@ApiBearerAuth(BEARER_AUTH_NAME)
@Controller('doctors')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get()
  @ApiOperation({ summary: 'List active doctors available for booking' })
  @ApiOkResponse({ type: DoctorResponseDto, isArray: true })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  listDoctors(): Promise<DoctorResponseDto[]> {
    return this.doctorsService.listActiveDoctors();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single active doctor by id' })
  @ApiOkResponse({ type: DoctorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  @ApiNotFoundResponse({ type: ErrorResponseDto })
  getDoctor(@Param('id', ParseObjectIdPipe) id: string): Promise<DoctorResponseDto> {
    return this.doctorsService.getActiveDoctor(id);
  }
}
