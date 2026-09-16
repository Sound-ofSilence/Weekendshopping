import type { Role } from '../constants/roles.enum';

export interface JwtPayload {
  sub: string;
  role: Role;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
