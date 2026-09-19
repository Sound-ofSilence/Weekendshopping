import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminProductsService } from './products.service';

@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminProductsController {
  constructor(private service: AdminProductsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Post(':spuId/off-sale')
  offSale(@CurrentUser() user: AuthUser, @Param('spuId', ParseIntPipe) spuId: number) {
    return this.service.offSale(Number(user.userId), spuId);
  }

  @Post(':spuId/approve')
  approve(@CurrentUser() user: AuthUser, @Param('spuId', ParseIntPipe) spuId: number) {
    return this.service.approve(Number(user.userId), spuId);
  }

  @Post(':spuId/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('spuId', ParseIntPipe) spuId: number,
    @Body() body: { reason: string },
  ) {
    return this.service.reject(Number(user.userId), spuId, body.reason ?? '');
  }
}