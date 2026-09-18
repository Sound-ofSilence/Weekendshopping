import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('orders')
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('preview')
  @ApiOperation({ summary: '价格试算' })
  preview(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
  ): Promise<Record<string, unknown>> {
    return this.ordersService.preview(user.userId, dto);
  }

  @Post()
  @ApiOperation({ summary: '创建订单' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateOrderDto,
    @Headers('x-request-id') requestId?: string,
    @Headers('x-channel') channel?: string,
  ): Promise<Record<string, unknown>[]> {
    return this.ordersService.createOrder(user.userId, dto, requestId ?? '', channel);
  }

  @Get()
  @ApiOperation({ summary: '订单列表（分页、状态筛选）' })
  list(
    @CurrentUser() user: AuthUser,
    @Query() query: PaginationQueryDto,
    @Query('status') status?: string,
  ): Promise<PaginatedResponseDto<Record<string, unknown>>> {
    return this.ordersService.list(user.userId, query, status);
  }

  @Get(':orderNo')
  @ApiOperation({ summary: '订单详情' })
  detail(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
  ): Promise<Record<string, unknown>> {
    return this.ordersService.detail(user.userId, orderNo);
  }

  @Post(':orderNo/cancel')
  @ApiOperation({ summary: '取消订单' })
  cancel(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
  ): Promise<null> {
    return this.ordersService.cancel(user.userId, orderNo);
  }
}
