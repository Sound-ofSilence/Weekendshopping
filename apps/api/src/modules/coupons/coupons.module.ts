import { Module } from '@nestjs/common';
import { CouponsController } from './coupons.controller';
import { CouponsScheduleService } from './coupons-schedule.service';
import { CouponsService } from './coupons.service';
import { SellerCouponsController } from './seller-coupons.controller';

@Module({
  controllers: [CouponsController, SellerCouponsController],
  providers: [CouponsService, CouponsScheduleService],
})
export class CouponsModule {}
