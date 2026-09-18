import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { MockPayService, PAY_SERVICE } from './pay.service';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';

@Module({
  imports: [RedisModule],
  controllers: [PaymentsController],
  providers: [PaymentsService, { provide: PAY_SERVICE, useClass: MockPayService }],
})
export class PaymentsModule {}
