import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { MockPayService, PAY_SERVICE } from './pay.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { RefundsController } from './refunds.controller';
import { RefundsService } from './refunds.service';

@Module({
  imports: [RedisModule],
  controllers: [PaymentsController, RefundsController],
  providers: [PaymentsService, RefundsService, { provide: PAY_SERVICE, useClass: MockPayService }],
})
export class PaymentsModule {}
