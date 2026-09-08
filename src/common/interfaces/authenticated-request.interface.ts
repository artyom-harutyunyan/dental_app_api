import { Request } from 'express';

import { UserRole } from '../enums/user-role.enum';

export interface JwtPayload {
  sub: string;
  role: UserRole;
  clinicId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
