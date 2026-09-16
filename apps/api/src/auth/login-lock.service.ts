import { HttpStatus, Injectable } from '@nestjs/common';
import { ErrorCode } from '../common/constants/error-codes';
import { AppException } from '../common/exceptions/app.exception';

interface LockRecord {
  count: number;
  lockedUntil: number;
}

/** 登录失败锁定服务（内存实现），方法语义可替换为 Redis 实现。 */
@Injectable()
export class LoginLockService {
  private readonly failures = new Map<string, LockRecord>();

  private readonly MAX_FAILURES = 5;
  private readonly LOCK_DURATION_MS = 15 * 60 * 1000;

  /** 检查是否处于锁定状态，锁定则抛错。 */
  check(phone: string): void {
    const record = this.failures.get(phone);
    if (record && record.lockedUntil > Date.now()) {
      throw new AppException(ErrorCode.FORBIDDEN, '账号已锁定，请15分钟后再试', HttpStatus.FORBIDDEN);
    }
  }

  /** 记录一次失败，连续达到阈值则锁定。 */
  recordFailure(phone: string): void {
    const now = Date.now();
    const existing = this.failures.get(phone);

    let count = existing?.count ?? 0;
    let lockedUntil = existing?.lockedUntil ?? 0;

    // 仅当锁定已过期时才重置计数（lockedUntil === 0 表示未锁定，不重置）
    if (lockedUntil !== 0 && now >= lockedUntil) {
      count = 0;
      lockedUntil = 0;
    }

    count += 1;
    if (count >= this.MAX_FAILURES) {
      lockedUntil = now + this.LOCK_DURATION_MS;
      count = 0;
    }

    this.failures.set(phone, { count, lockedUntil });
  }

  /** 登录成功后清除失败记录。 */
  reset(phone: string): void {
    this.failures.delete(phone);
  }
}
