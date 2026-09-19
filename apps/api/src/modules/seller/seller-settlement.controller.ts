import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { SettlementService } from './settlement.service';

@Controller('seller/settlements')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.MERCHANT)
export class SellerSettlementController {
  constructor(private service: SettlementService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Get(':settlementNo')
  detail(@Param('settlementNo') settlementNo: string) {
    return this.service.detail(settlementNo);
  }
}