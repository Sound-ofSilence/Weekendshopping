import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { OrdersController } from './orders.controller';
import { OrdersScheduleService } from './orders-schedule.service';
import { OrdersService } from './orders.service';

@Module({
  imports: [RedisModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersScheduleService],
})
export class OrdersModule {}
