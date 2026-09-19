import { Body, Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { SeckillService } from './seckill.service';
import { SeckillQueryDto } from './dto/seckill-query.dto';

@Controller('seckill')
export class SeckillController {
  constructor(private service: SeckillService) {}

  @Get('activities')
  @Public()
  listActivities(@Query() query: SeckillQueryDto) {
    return this.service.listActivities(query);
  }

  @Get('activities/:id/products')
  @Public()
  listProducts(@Param('id', ParseIntPipe) id: number) {
    return this.service.listActivityProducts(id);
  }

  @Post('products/:id/buy')
  @UseGuards(JwtAuthGuard)
  buy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { quantity: number; addressId: number },
  ) {
    return this.service.buy(Number(user.userId), id, body.quantity, body.addressId);
  }
}