import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ErrorCode, ErrorMessage } from '../constants/error-codes';
import { Role } from '../constants/roles.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AppException } from '../exceptions/app.exception';
import type { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;
    if (!user) {
      throw new AppException(ErrorCode.UNAUTHORIZED, ErrorMessage[ErrorCode.UNAUTHORIZED], HttpStatus.UNAUTHORIZED);
    }
    if (!requiredRoles.includes(user.role)) {
      throw new AppException(ErrorCode.FORBIDDEN, ErrorMessage[ErrorCode.FORBIDDEN], HttpStatus.FORBIDDEN);
    }
    return true;
  }
}
