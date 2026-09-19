import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { WalletService } from './wallet.service';
import { SettlementService } from './settlement.service';
import { SellerDashboardController } from './seller-dashboard.controller';
import { SellerWalletController } from './seller-wallet.controller';
import { SellerSettlementController } from './seller-settlement.controller';
import { SellerOrdersController } from './seller-orders.controller';

@Module({
  controllers: [
    SellerDashboardController,
    SellerWalletController,
    SellerSettlementController,
    SellerOrdersController,
  ],
  providers: [DashboardService, WalletService, SettlementService],
  exports: [DashboardService, WalletService, SettlementService],
})
export class SellerModule {}