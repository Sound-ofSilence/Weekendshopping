import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationModule } from '../notifications/notification.module';
import { FreightController } from './freight.controller';
import { FreightService } from './freight.service';
import { ShipmentController } from './shipment.controller';
import { ShipmentService } from './shipment.service';

@Module({
  imports: [PrismaModule, NotificationModule],
  controllers: [FreightController, ShipmentController],
  providers: [FreightService, ShipmentService],
})
export class LogisticsModule {}