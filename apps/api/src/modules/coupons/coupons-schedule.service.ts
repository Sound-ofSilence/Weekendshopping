import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * 优惠券过期定时任务
 * 每小时扫描一次：status=0（未使用）且 expiredAt < now 的用户券 → status=2（已过期）
 */
@Injectable()
export class CouponsScheduleService {
  private readonly logger = new Logger(CouponsScheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  @Cron('0 * * * *')
  async expireCoupons(): Promise<void> {
    const now = new Date();
    const result = await this.prisma.userCoupon.updateMany({
      where: { status: 0, expiredAt: { lt: now } },
      data: { status: 2 },
    });

    if (result.count > 0) {
      this.logger.log(`已将 ${result.count} 张用户券标记为已过期`);
    }
  }
}
