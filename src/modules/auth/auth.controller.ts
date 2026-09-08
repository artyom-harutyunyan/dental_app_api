import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { BEARER_AUTH_NAME } from '../../common/constants/swagger.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { ErrorResponseDto } from '../../common/dto/error-response.dto';
import { JwtPayload } from '../../common/interfaces/authenticated-request.interface';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a patient account and return a JWT for immediate use',
  })
  @ApiCreatedResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Email already registered' })
  register(@Body() dto: RegisterDto): Promise<AuthResponseDto> {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Exchange email and password for a JWT (patient or staff)',
  })
  @ApiOkResponse({ type: AuthResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.authService.login(dto);
  }

  @Get('me')
  @ApiBearerAuth(BEARER_AUTH_NAME)
  @ApiOperation({
    summary: 'Return the authenticated user profile (no password fields)',
  })
  @ApiOkResponse({ type: UserResponseDto })
  @ApiUnauthorizedResponse({ type: ErrorResponseDto })
  me(@CurrentUser() user: JwtPayload): Promise<UserResponseDto> {
    return this.authService.me(user.sub);
  }
}
