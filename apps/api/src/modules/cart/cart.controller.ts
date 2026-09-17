import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CartService, CartShopGroupResponse } from './cart.service';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@ApiTags('cart')
@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: '购物车列表（按店铺分组）' })
  list(@CurrentUser() user: AuthUser): Promise<CartShopGroupResponse[]> {
    return this.cartService.list(Number(user.userId));
  }

  @Post('items')
  @ApiOperation({ summary: '加购（同 SKU 数量累加）' })
  add(@CurrentUser() user: AuthUser, @Body() dto: AddCartItemDto): Promise<void> {
    return this.cartService.addItem(Number(user.userId), dto);
  }

  @Patch('items/:id')
  @ApiOperation({ summary: '改数量或勾选' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCartItemDto,
  ): Promise<void> {
    return this.cartService.updateItem(Number(user.userId), id, dto);
  }

  @Delete('items/:id')
  @ApiOperation({ summary: '删除单项' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.cartService.removeItem(Number(user.userId), id);
  }

  @Delete('invalid')
  @ApiOperation({ summary: '清空失效项' })
  removeInvalid(@CurrentUser() user: AuthUser): Promise<void> {
    return this.cartService.removeInvalid(Number(user.userId));
  }
}
