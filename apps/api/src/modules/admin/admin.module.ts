import { Module } from '@nestjs/common';
import { AdminLogService } from './admin-log.service';
import { AdminDashboardService } from './dashboard.service';
import { AdminShopsService } from './shops.service';
import { AdminProductsService } from './products.service';
import { AdminUsersService } from './users.service';
import { AdminAfterSalesService } from './after-sales.service';
import { AdminWithdrawalsService } from './withdrawals.service';
import { AdminDashboardController } from './admin-dashboard.controller';
import { AdminShopsController } from './admin-shops.controller';
import { AdminProductsController } from './admin-products.controller';
import { AdminUsersController } from './admin-users.controller';
import { AdminAfterSalesController } from './admin-after-sales.controller';
import { AdminWithdrawalsController } from './admin-withdrawals.controller';
import { AdminLogsController } from './admin-logs.controller';

@Module({
  controllers: [
    AdminDashboardController,
    AdminShopsController,
    AdminProductsController,
    AdminUsersController,
    AdminAfterSalesController,
    AdminWithdrawalsController,
    AdminLogsController,
  ],
  providers: [
    AdminLogService,
    AdminDashboardService,
    AdminShopsService,
    AdminProductsService,
    AdminUsersService,
    AdminAfterSalesService,
    AdminWithdrawalsService,
  ],
  exports: [AdminLogService],
})
export class AdminModule {}