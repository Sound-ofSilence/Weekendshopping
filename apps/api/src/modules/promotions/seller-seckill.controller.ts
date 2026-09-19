import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { SeckillService } from './seckill.service';
import { CreateSeckillActivityDto } from './dto/create-seckill.dto';

@Controller('seller/seckill')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class SellerSeckillController {
  constructor(private service: SeckillService) {}

  @Post('activities')
  createActivity(@Body() dto: CreateSeckillActivityDto) {
    return this.service.createActivity(dto);
  }
}