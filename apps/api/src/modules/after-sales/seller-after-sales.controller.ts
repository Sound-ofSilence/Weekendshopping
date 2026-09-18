import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { AfterSalesService } from './after-sales.service';

@Controller('seller/after-sales')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class SellerAfterSalesController {
  constructor(private service: AfterSalesService) {}

  @Post(':afterSaleNo/agree')
  agree(@CurrentUser() user: AuthUser, @Param('afterSaleNo') no: string) {
    return this.service.sellerAgree(Number(user.userId), no);
  }

  @Post(':afterSaleNo/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('afterSaleNo') no: string,
    @Body() dto: { reason: string },
  ) {
    return this.service.sellerReject(Number(user.userId), no, dto.reason);
  }

  @Post(':afterSaleNo/receive')
  receive(@CurrentUser() user: AuthUser, @Param('afterSaleNo') no: string) {
    return this.service.sellerReceive(Number(user.userId), no);
  }
}