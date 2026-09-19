import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { AdminDashboardService } from './dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminDashboardController {
  constructor(private service: AdminDashboardService) {}

  @Get('stats')
  stats() {
    return this.service.getStats();
  }

  @Get('trend')
  trend() {
    return this.service.getTrend();
  }

  @Get('top-shops')
  topShops() {
    return this.service.getTopShops();
  }

  @Get('top-categories')
  topCategories() {
    return this.service.getTopCategories();
  }
}