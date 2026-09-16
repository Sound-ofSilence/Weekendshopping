import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { AuthService } from '../../src/auth/auth.service';
import { LoginLockService } from '../../src/auth/login-lock.service';
import { SmsService } from '../../src/auth/sms.service';
import { ErrorCode } from '../../src/common/constants/error-codes';
import { hashPassword } from '../../src/common/utils/password.util';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('AuthService (unit)', () => {
  const PHONE = '13800138000';
  const PASSWORD = 'abc12345';

  const userRecord = {
    id: 1,
    phone: PHONE,
    email: null,
    passwordHash: '',
    nickname: null,
    avatar: null,
    gender: null,
    birthday: null,
    status: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    roles: [{ id: 1, userId: 1, roleCode: 'buyer', scopeId: null, createdAt: new Date() }],
  };

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  const jwtServiceMock = {
    signAsync: jest.fn(),
    verifyAsync: jest.fn(),
  };
  const configServiceMock = {
    get: jest.fn((key: string) => {
      if (key === 'jwt.secret') return 'test-secret';
      if (key === 'jwt.expiresIn') return '7d';
      if (key === 'jwt.refreshExpiresIn') return '30d';
      return undefined;
    }),
  };

  let authService: AuthService;
  let smsService: SmsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    jwtServiceMock.signAsync.mockImplementation((payload: { type?: string }) =>
      Promise.resolve(payload.type === 'refresh' ? 'refresh-token' : 'access-token'),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        SmsService,
        LoginLockService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: JwtService, useValue: jwtServiceMock },
        { provide: ConfigService, useValue: configServiceMock },
      ],
    }).compile();

    authService = moduleRef.get(AuthService);
    smsService = moduleRef.get(SmsService);
  });

  describe('register', () => {
    it('注册成功并返回双 token', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({ ...userRecord });

      const code = smsService.send(PHONE, '127.0.0.1');
      const result = await authService.register({ phone: PHONE, smsCode: code, password: PASSWORD });

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
      expect(result.user.phone).toBe(PHONE);
      expect(result.user).not.toHaveProperty('passwordHash');

      const createArg = prismaMock.user.create.mock.calls[0][0];
      expect(createArg.data.phone).toBe(PHONE);
      expect(createArg.data.passwordHash).not.toBe(PASSWORD);
      expect(createArg.data.roles.create.roleCode).toBe('buyer');
    });

    it('重复手机号注册返回冲突', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userRecord });

      const code = smsService.send(PHONE, '127.0.0.1');
      await expect(authService.register({ phone: PHONE, smsCode: code, password: PASSWORD })).rejects.toMatchObject({
        code: ErrorCode.CONFLICT,
        message: '手机号已注册',
      });
    });

    it('验证码错误注册失败', async () => {
      await expect(authService.register({ phone: PHONE, smsCode: '000000', password: PASSWORD })).rejects.toMatchObject({
        code: ErrorCode.BAD_REQUEST,
        message: '验证码错误或已过期',
      });
    });
  });

  describe('login', () => {
    it('密码正确登录成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userRecord, passwordHash: await hashPassword(PASSWORD) });

      const result = await authService.login({ phone: PHONE, password: PASSWORD });

      expect(result.accessToken).toBe('access-token');
      expect(result.user.phone).toBe(PHONE);
    });

    it('密码错误登录失败', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userRecord, passwordHash: await hashPassword(PASSWORD) });

      await expect(authService.login({ phone: PHONE, password: 'wrong12345' })).rejects.toMatchObject({
        code: ErrorCode.BAD_REQUEST,
        message: '手机号或密码错误',
      });
    });

    it('连续失败5次后锁定', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userRecord, passwordHash: await hashPassword(PASSWORD) });

      for (let i = 0; i < 5; i += 1) {
        await expect(authService.login({ phone: PHONE, password: 'wrong12345' })).rejects.toMatchObject({
          code: ErrorCode.BAD_REQUEST,
          message: '手机号或密码错误',
        });
      }

      await expect(authService.login({ phone: PHONE, password: PASSWORD })).rejects.toMatchObject({
        code: ErrorCode.FORBIDDEN,
        message: '账号已锁定，请15分钟后再试',
      });
    });

    it('验证码登录成功', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ ...userRecord, passwordHash: await hashPassword(PASSWORD) });

      const code = smsService.send(PHONE, '127.0.0.1');
      const result = await authService.login({ phone: PHONE, smsCode: code });

      expect(result.accessToken).toBe('access-token');
    });
  });

  describe('refresh', () => {
    it('刷新成功返回新 token', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: '1', role: 'buyer', type: 'refresh' });
      prismaMock.user.findUnique.mockResolvedValue({ ...userRecord });

      const result = await authService.refresh('refresh-token');

      expect(result.accessToken).toBe('access-token');
      expect(result.refreshToken).toBe('refresh-token');
    });

    it('非法 refresh token 抛错', async () => {
      jwtServiceMock.verifyAsync.mockRejectedValue(new Error('invalid'));

      await expect(authService.refresh('bad-token')).rejects.toMatchObject({ code: ErrorCode.TOKEN_INVALID });
    });

    it('access token 不能用于刷新', async () => {
      jwtServiceMock.verifyAsync.mockResolvedValue({ sub: '1', role: 'buyer', type: 'access' });

      await expect(authService.refresh('access-token')).rejects.toMatchObject({ code: ErrorCode.TOKEN_INVALID });
    });
  });
});
