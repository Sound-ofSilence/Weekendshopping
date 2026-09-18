//import { Module } from '@nestjs/common';
//import { ScheduleModule } from '@nestjs/schedule';
//import { PaymentsModule } from '../payments/payments.module';
//import { AfterSalesController } from './after-sales.controller';
//import { SellerAfterSalesController } from './seller-after-sales.controller';
//import { AfterSalesScheduleService } from './after-sales-schedule.service';
//import { AfterSalesService } from './after-sales.service';
//
//@Module({
//  imports: [PaymentsModule, ScheduleModule.forRoot()],
//  controllers: [AfterSalesController, SellerAfterSalesController],
//  providers: [AfterSalesService, AfterSalesScheduleService],
//})
//export class AfterSalesModule {}


import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AfterSalesService } from './after-sales.service';
import { AfterSalesController } from './after-sales.controller';
import { SellerAfterSalesController } from './seller-after-sales.controller';
import { AfterSalesScheduleService } from './after-sales-schedule.service';

@Module({
  imports: [ScheduleModule.forRoot()],
  controllers: [AfterSalesController, SellerAfterSalesController],
  providers: [AfterSalesService, AfterSalesScheduleService],
})
export class AfterSalesModule {}