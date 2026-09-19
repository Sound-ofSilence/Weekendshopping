import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminAfterSalesService } from './after-sales.service';

@Controller('admin/after-sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminAfterSalesController {
  constructor(private service: AdminAfterSalesService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Post(':afterSaleNo/intervene')
  intervene(
    @CurrentUser() user: AuthUser,
    @Param('afterSaleNo') afterSaleNo: string,
  ) {
    return this.service.intervene(Number(user.userId), afterSaleNo);
  }
}