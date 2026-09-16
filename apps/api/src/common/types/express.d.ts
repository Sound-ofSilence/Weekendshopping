import type { AuthUser } from '../interfaces/auth-user.interface';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      traceId?: string;
      user?: AuthUser;
    }
  }
}

export {};
