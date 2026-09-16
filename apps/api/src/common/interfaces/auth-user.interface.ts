import type { Role } from '../constants/roles.enum';

export interface AuthUser {
  userId: string;
  role: Role;
}
