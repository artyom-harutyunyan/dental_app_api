import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from '../../common/interfaces/authenticated-request.interface';
import { UserDocument } from '../users/schemas/user.schema';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';

const BCRYPT_COST = 10;
const INVALID_CREDENTIALS_MESSAGE = 'Invalid email or password';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    const passwordHash = await this.hashPassword(dto.password);

    try {
      const user = await this.usersService.create({
        name: dto.name.trim(),
        email: dto.email,
        phone: dto.phone.trim(),
        passwordHash,
        role: UserRole.PATIENT,
        clinicId: null,
      });

      return this.buildAuthResponse(user);
    } catch (error: unknown) {
      if (this.isDuplicateKeyError(error)) {
        throw new ConflictException('An account with this email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.usersService.findByEmailWithPassword(dto.email);

    if (!user || !user.active) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    if (!user.passwordHash) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS_MESSAGE);
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string): Promise<UserResponseDto> {
    const user = await this.usersService.findByIdOrFail(userId);
    return this.toUserResponse(user);
  }

  hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }

  private buildAuthResponse(user: UserDocument): AuthResponseDto {
    const payload: JwtPayload = {
      sub: user.id,
      role: user.role,
      clinicId: user.clinicId ? String(user.clinicId) : null,
    };

    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: this.toUserResponse(user),
    };
  }

  private toUserResponse(user: UserDocument): UserResponseDto {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      clinicId: user.clinicId ? String(user.clinicId) : null,
    };
  }

  private isDuplicateKeyError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code: number }).code === 11000
    );
  }
}
