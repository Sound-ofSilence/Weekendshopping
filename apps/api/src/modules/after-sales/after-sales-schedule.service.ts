import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { AfterSalesService } from './after-sales.service';

@Injectable()
export class AfterSalesScheduleService {
  private readonly logger = new Logger(AfterSalesScheduleService.name);

  constructor(
    private prisma: PrismaService,
    private afterSalesService: AfterSalesService,
  ) {}

  @Cron('0 * * * *')
  async autoAgreeExpired() {
    const threshold = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const expired = await this.prisma.afterSale.findMany({
      where: { status: 0, createdAt: { lt: threshold } },
      take: 100,
    });

    if (expired.length === 0) return;
    this.logger.log(`Auto-agreeing ${expired.length} expired after-sales`);

    for (const a of expired) {
      try {
        await this.afterSalesService.sellerAgree(0, a.afterSaleNo);
      } catch (e: any) {
        this.logger.error(`Failed to auto-agree ${a.afterSaleNo}: ${e.message}`);
      }
    }
  }
}