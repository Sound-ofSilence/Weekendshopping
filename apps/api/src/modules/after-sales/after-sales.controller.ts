import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AfterSalesService } from './after-sales.service';
import { CreateAfterSaleDto } from './dto/create-after-sale.dto';
import { AfterSaleQueryDto } from './dto/after-sale-query.dto';

@Controller('after-sales')
@UseGuards(JwtAuthGuard)
export class AfterSalesController {
  constructor(private service: AfterSalesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateAfterSaleDto) {
    return this.service.create(Number(user.userId), dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: AfterSaleQueryDto) {
    return this.service.listByUser(Number(user.userId), query);
  }

  @Get(':afterSaleNo')
  detail(@CurrentUser() user: AuthUser, @Param('afterSaleNo') no: string) {
    return this.service.detail(Number(user.userId), no);
  }

  @Post(':afterSaleNo/cancel')
  cancel(@CurrentUser() user: AuthUser, @Param('afterSaleNo') no: string) {
    return this.service.cancel(Number(user.userId), no);
  }

  @Post(':afterSaleNo/ship-back')
  shipBack(
    @CurrentUser() user: AuthUser,
    @Param('afterSaleNo') no: string,
    @Body() dto: { returnTrackingNo: string; returnExpressCode?: string },
  ) {
    return this.service.shipBack(Number(user.userId), no, dto);
  }

  @Post(':afterSaleNo/intervene')
  intervene(@CurrentUser() user: AuthUser, @Param('afterSaleNo') no: string) {
    return this.service.intervene(Number(user.userId), no);
  }
}