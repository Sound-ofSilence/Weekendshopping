import { HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ErrorCode, ErrorMessage } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/app.exception';
import type { AuthUser } from '../common/interfaces/auth-user.interface';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret') ?? '',
    });
  }

  validate(payload: JwtPayload): AuthUser {
    // 拒绝将 refreshToken 当作 accessToken 使用
    if (payload.type === 'refresh') {
      throw new AppException(ErrorCode.TOKEN_INVALID, ErrorMessage[ErrorCode.TOKEN_INVALID], HttpStatus.UNAUTHORIZED);
    }
    return { userId: payload.sub, role: payload.role };
  }
}
