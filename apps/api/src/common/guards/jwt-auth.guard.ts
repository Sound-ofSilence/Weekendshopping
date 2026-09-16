import { ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Observable } from 'rxjs';
import { ErrorCode, ErrorMessage } from '../constants/error-codes';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AppException } from '../exceptions/app.exception';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }
    return super.canActivate(context);
  }

  handleRequest<TUser>(err: unknown, user: TUser, info: unknown): TUser {
    if (err || !user) {
      const message = (info as { message?: string } | null)?.message ?? '';
      if (message === 'jwt expired') {
        throw new AppException(ErrorCode.TOKEN_EXPIRED, ErrorMessage[ErrorCode.TOKEN_EXPIRED], HttpStatus.UNAUTHORIZED);
      }
      if (message === 'No auth token') {
        throw new AppException(ErrorCode.UNAUTHORIZED, ErrorMessage[ErrorCode.UNAUTHORIZED], HttpStatus.UNAUTHORIZED);
      }
      throw new AppException(ErrorCode.TOKEN_INVALID, ErrorMessage[ErrorCode.TOKEN_INVALID], HttpStatus.UNAUTHORIZED);
    }
    return user;
  }
}
