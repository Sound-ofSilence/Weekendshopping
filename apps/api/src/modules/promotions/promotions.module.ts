import { Module } from '@nestjs/common';
import { PromotionsService } from './promotions.service';
import { SellerPromotionsController } from './seller-promotions.controller';
import { SeckillService } from './seckill.service';
import { SeckillController } from './seckill.controller';
import { SellerSeckillController } from './seller-seckill.controller';

@Module({
  controllers: [
    SellerPromotionsController,
    SeckillController,
    SellerSeckillController,
  ],
  providers: [PromotionsService, SeckillService],
  exports: [PromotionsService, SeckillService],
})
export class PromotionsModule {}