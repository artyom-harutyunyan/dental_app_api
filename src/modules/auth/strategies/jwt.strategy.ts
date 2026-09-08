import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { UserRole } from '../../../common/enums/user-role.enum';
import { JwtPayload } from '../../../common/interfaces/authenticated-request.interface';

interface RawJwtPayload {
  sub: string;
  role: UserRole;
  clinicId: string | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.getOrThrow<string>('jwt.secret'),
    });
  }

  validate(payload: RawJwtPayload): JwtPayload {
    return {
      sub: payload.sub,
      role: payload.role,
      clinicId: payload.clinicId,
    };
  }
}
