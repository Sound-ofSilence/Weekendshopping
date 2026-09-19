import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { DashboardService } from './dashboard.service';

@Controller('seller/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class SellerDashboardController {
  constructor(private service: DashboardService) {}

  @Get('stats')
  stats() {
    return this.service.getStats();
  }

  @Get('sales-trend')
  salesTrend() {
    return this.service.getSalesTrend();
  }

  @Get('top-products')
  topProducts() {
    return this.service.getTopProducts();
  }
}