import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminShopsService } from './shops.service';

@Controller('admin/shops')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminShopsController {
  constructor(private service: AdminShopsService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Post(':shopId/freeze')
  freeze(@CurrentUser() user: AuthUser, @Param('shopId', ParseIntPipe) shopId: number) {
    return this.service.freeze(Number(user.userId), shopId);
  }

  @Post(':shopId/unfreeze')
  unfreeze(@CurrentUser() user: AuthUser, @Param('shopId', ParseIntPipe) shopId: number) {
    return this.service.unfreeze(Number(user.userId), shopId);
  }
}