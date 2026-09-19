import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminWithdrawalsService } from './withdrawals.service';

@Controller('admin/withdrawals')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminWithdrawalsController {
  constructor(private service: AdminWithdrawalsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Post(':withdrawalNo/approve')
  approve(
    @CurrentUser() user: AuthUser,
    @Param('withdrawalNo') withdrawalNo: string,
  ) {
    return this.service.approve(Number(user.userId), withdrawalNo);
  }

  @Post(':withdrawalNo/reject')
  reject(
    @CurrentUser() user: AuthUser,
    @Param('withdrawalNo') withdrawalNo: string,
    @Body() body: { reason: string },
  ) {
    return this.service.reject(Number(user.userId), withdrawalNo, body.reason ?? '');
  }
}