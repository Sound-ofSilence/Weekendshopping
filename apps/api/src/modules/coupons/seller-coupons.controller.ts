import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum';
import { Roles } from '../../common/decorators/roles.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { CouponsService } from './coupons.service';
import { CouponQueryDto } from './dto/coupon-query.dto';
import { CouponResponseDto } from './dto/coupon-response.dto';
import { CreateCouponDto } from './dto/create-coupon.dto';

@ApiTags('seller-coupons')
@Roles(Role.MERCHANT)
@Controller('seller/coupons')
export class SellerCouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Post()
  @ApiOperation({ summary: '商家创建券' })
  create(@Body() dto: CreateCouponDto): Promise<CouponResponseDto> {
    return this.couponsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '商家券列表' })
  list(
    @Query() query: CouponQueryDto,
  ): Promise<PaginatedResponseDto<CouponResponseDto>> {
    return this.couponsService.listSeller(query);
  }
}
