import { HttpStatus, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { User, UserRole } from '@prisma/client';
import { ErrorCode, ErrorMessage } from '../common/constants/error-codes';
import { Role } from '../common/constants/roles.enum';
import { toUserResponse } from '../common/dto/user-response.dto';
import { AppException } from '../common/exceptions/app.exception';
import type { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { comparePassword, hashPassword } from '../common/utils/password.util';
import { PrismaService } from '../prisma/prisma.service';
import type { AuthResponseDto } from './dto/auth-response.dto';
import type { LoginDto } from './dto/login.dto';
import type { RegisterDto } from './dto/register.dto';
import type { SendSmsDto } from './dto/send-sms.dto';
import { LoginLockService } from './login-lock.service';
import { SmsService } from './sms.service';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly smsService: SmsService,
    private readonly loginLockService: LoginLockService,
  ) {}

  async sendSms(dto: SendSmsDto, ip: string): Promise<void> {
    const code = this.smsService.send(dto.phone, ip);
    this.logger.log(`[DEV] 验证码(phone=${dto.phone})：${code}`);
  }

  async register(dto: RegisterDto): Promise<AuthResponseDto> {
    this.smsService.verify(dto.phone, dto.smsCode);

    const existing = await this.prisma.user.findUnique({ where: { phone: dto.phone } });
    if (existing) {
      throw new AppException(ErrorCode.CONFLICT, '手机号已注册', HttpStatus.CONFLICT);
    }

    const passwordHash = await hashPassword(dto.password);
    const user = await this.prisma.user.create({
      data: {
        phone: dto.phone,
        passwordHash,
        nickname: dto.nickname,
        status: 1,
        roles: { create: { roleCode: Role.BUYER } },
      },
    });

    return this.buildAuthResponse(user.id, Role.BUYER, user);
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    if (!dto.password && !dto.smsCode) {
      throw new AppException(ErrorCode.BAD_REQUEST, '请提供密码或验证码', HttpStatus.BAD_REQUEST);
    }

    this.loginLockService.check(dto.phone);

    const user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
      include: { roles: true },
    });

    if (!user || user.deletedAt) {
      this.loginLockService.recordFailure(dto.phone);
      throw new AppException(ErrorCode.BAD_REQUEST, '手机号或密码错误', HttpStatus.BAD_REQUEST);
    }
    if (user.status !== 1) {
      throw new AppException(ErrorCode.FORBIDDEN, '账号已被禁用', HttpStatus.FORBIDDEN);
    }

    const authed = dto.password
      ? await comparePassword(dto.password, user.passwordHash)
      : this.verifySmsCode(dto.phone, dto.smsCode);

    if (!authed) {
      this.loginLockService.recordFailure(dto.phone);
      throw new AppException(ErrorCode.BAD_REQUEST, '手机号或密码错误', HttpStatus.BAD_REQUEST);
    }

    this.loginLockService.reset(dto.phone);
    return this.buildAuthResponse(user.id, this.primaryRole(user.roles), user);
  }

  async refresh(refreshToken: string): Promise<AuthResponseDto> {
    let payload: JwtPayload;
    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, { secret: this.secret });
    } catch {
      throw new AppException(ErrorCode.TOKEN_INVALID, ErrorMessage[ErrorCode.TOKEN_INVALID], HttpStatus.UNAUTHORIZED);
    }
    if (payload.type !== 'refresh') {
      throw new AppException(ErrorCode.TOKEN_INVALID, ErrorMessage[ErrorCode.TOKEN_INVALID], HttpStatus.UNAUTHORIZED);
    }

    const userId = Number(payload.sub);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { roles: true },
    });
    if (!user || user.deletedAt || user.status !== 1) {
      throw new AppException(ErrorCode.UNAUTHORIZED, '账号不存在或已被禁用', HttpStatus.UNAUTHORIZED);
    }

    return this.buildAuthResponse(user.id, this.primaryRole(user.roles), user);
  }

  logout(): Promise<void> {
    // JWT 无状态，登出由客户端丢弃 token 完成
    return Promise.resolve();
  }

  private get secret(): string {
    return this.configService.get<string>('jwt.secret') ?? '';
  }

  private async issueTokens(userId: number, role: Role): Promise<TokenPair> {
    const payload = { sub: String(userId), role };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        { ...payload, type: 'access' },
        { secret: this.secret, expiresIn: this.configService.get<string>('jwt.expiresIn') ?? '7d' },
      ),
      this.jwtService.signAsync(
        { ...payload, type: 'refresh' },
        { secret: this.secret, expiresIn: this.configService.get<string>('jwt.refreshExpiresIn') ?? '30d' },
      ),
    ]);
    return { accessToken, refreshToken };
  }

  private async buildAuthResponse(userId: number, role: Role, user: User): Promise<AuthResponseDto> {
    const { accessToken, refreshToken } = await this.issueTokens(userId, role);
    return { accessToken, refreshToken, user: toUserResponse(user) };
  }

  private verifySmsCode(phone: string, smsCode?: string): boolean {
    if (!smsCode) return false;
    try {
      this.smsService.verify(phone, smsCode);
      return true;
    } catch {
      return false;
    }
  }

  private primaryRole(roles: UserRole[]): Role {
    const roleCode = roles[0]?.roleCode;
    if (roleCode === Role.ADMIN || roleCode === Role.MERCHANT || roleCode === Role.BUYER) {
      return roleCode;
    }
    return Role.BUYER;
  }
}
