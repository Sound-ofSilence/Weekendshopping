import {
  Body,
  Controller,
  Get,
  Param,
  ParseArrayPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ShipOrderDto, ShipOrderItemDto } from './dto/ship-order.dto';
import { ShipmentService } from './shipment.service';

@ApiTags('logistics')
@UseGuards(JwtAuthGuard)
@Controller()
export class ShipmentController {
  constructor(private readonly shipmentService: ShipmentService) {}

  @Post('seller/orders/:orderNo/ship')
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: '订单发货' })
  ship(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
    @Body() dto: ShipOrderDto,
  ): Promise<Record<string, unknown>> {
    return this.shipmentService.ship(user.userId, orderNo, dto);
  }

  @Post('seller/orders/batch-ship')
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: '批量发货' })
  batchShip(
    @CurrentUser() user: AuthUser,
    @Body(new ParseArrayPipe({ items: ShipOrderItemDto })) items: ShipOrderItemDto[],
  ): Promise<{ success: number; failed: Array<{ orderNo: string; reason: string }> }> {
    return this.shipmentService.batchShip(user.userId, items);
  }

  @Get('shipments/:orderNo')
  @ApiOperation({ summary: '查询物流轨迹' })
  query(
    @CurrentUser() user: AuthUser,
    @Param('orderNo') orderNo: string,
  ): Promise<Record<string, unknown>> {
    return this.shipmentService.query(user.userId, orderNo);
  }
}
