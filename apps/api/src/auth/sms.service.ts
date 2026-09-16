import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/app.exception';

interface SmsRecord {
  code: string;
  sentAt: number;
  expiresAt: number;
}

interface IpWindow {
  count: number;
  windowStart: number;
}

/**
 * 验证码服务（内存实现）。
 * 方法语义与 Redis 版保持一致，后续可替换为 RedisSmsCodeStore 实现。
 */
@Injectable()
export class SmsService {
  private readonly codes = new Map<string, SmsRecord>();
  private readonly ipCounts = new Map<string, IpWindow>();

  private readonly RESEND_INTERVAL_MS = 60 * 1000;
  private readonly CODE_TTL_MS = 5 * 60 * 1000;
  private readonly IP_LIMIT = 10;
  private readonly IP_WINDOW_MS = 60 * 60 * 1000;

  /** 生成并"发送"验证码，返回验证码（仅用于开发环境日志/联调）。 */
  send(phone: string, ip: string): string {
    this.assertIpLimit(ip);

    const existing = this.codes.get(phone);
    if (existing && Date.now() - existing.sentAt < this.RESEND_INTERVAL_MS) {
      throw new AppException(ErrorCode.BAD_REQUEST, '验证码发送过于频繁，请稍后再试', HttpStatus.BAD_REQUEST);
    }

    const code = this.generateCode();
    this.codes.set(phone, { code, sentAt: Date.now(), expiresAt: Date.now() + this.CODE_TTL_MS });
    this.recordIp(ip);
    return code;
  }

  /** 校验验证码，成功后作废（一次性）。 */
  verify(phone: string, code: string): void {
    const record = this.codes.get(phone);
    if (!record || record.code !== code || Date.now() > record.expiresAt) {
      throw new AppException(ErrorCode.BAD_REQUEST, '验证码错误或已过期', HttpStatus.BAD_REQUEST);
    }
    this.codes.delete(phone);
  }

  private generateCode(): string {
    return String(Math.floor(100000 + Math.random() * 900000));
  }

  private assertIpLimit(ip: string): void {
    const now = Date.now();
    const window = this.ipCounts.get(ip);
    if (!window || now - window.windowStart >= this.IP_WINDOW_MS) {
      return;
    }
    if (window.count >= this.IP_LIMIT) {
      throw new AppException(ErrorCode.BAD_REQUEST, '发送验证码次数过多，请稍后再试', HttpStatus.BAD_REQUEST);
    }
  }

  private recordIp(ip: string): void {
    const now = Date.now();
    const window = this.ipCounts.get(ip);
    if (!window || now - window.windowStart >= this.IP_WINDOW_MS) {
      this.ipCounts.set(ip, { count: 1, windowStart: now });
      return;
    }
    window.count += 1;
  }
}
