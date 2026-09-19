import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { WalletService } from './wallet.service';
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';

@Controller('seller')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class SellerWalletController {
  constructor(private service: WalletService) {}

  @Get('wallet')
  getWallet() {
    return this.service.getWallet();
  }

  @Get('withdrawals')
  listWithdrawals(@Query() query: PaginationQueryDto) {
    return this.service.listWithdrawals(query);
  }

  @Post('withdrawals')
  createWithdrawal(@Body() dto: CreateWithdrawalDto) {
    return this.service.createWithdrawal(dto);
  }
}