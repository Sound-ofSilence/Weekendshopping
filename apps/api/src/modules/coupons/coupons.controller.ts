import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CouponsService } from './coupons.service';
import type { AvailableCouponsResult } from './coupons.service';
import {
  AvailableCouponQueryDto,
  CouponQueryDto,
} from './dto/coupon-query.dto';
import {
  CouponResponseDto,
  UserCouponResponseDto,
} from './dto/coupon-response.dto';
import { ReceiveCouponDto } from './dto/receive-coupon.dto';

@ApiTags('coupons')
@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: '领券中心（平台券 + 店铺券，公开）' })
  list(
    @Query() query: CouponQueryDto,
  ): Promise<PaginatedResponseDto<CouponResponseDto>> {
    return this.couponsService.listPublic(query);
  }

  @Post(':id/receive')
  @ApiOperation({ summary: '买家领券' })
  receive(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() _body?: ReceiveCouponDto,
  ): Promise<UserCouponResponseDto> {
    return this.couponsService.receive(user.userId, Number(id));
  }

  @Get('my')
  @ApiOperation({ summary: '我的券（可用/已用/过期）' })
  my(
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
  ): Promise<UserCouponResponseDto[]> {
    return this.couponsService.my(user.userId, status);
  }

  @Get('available')
  @ApiOperation({ summary: '下单时可用券（传 shopId + amount）' })
  available(
    @CurrentUser() user: AuthUser,
    @Query() query: AvailableCouponQueryDto,
  ): Promise<AvailableCouponsResult> {
    return this.couponsService.available(user.userId, query.shopId, query.amount);
  }
}
