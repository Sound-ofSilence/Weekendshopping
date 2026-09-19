import { Controller, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { AdminUsersService } from './users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
export class AdminUsersController {
  constructor(private service: AdminUsersService) {}

  @Get()
  list(@Query() query: PaginationQueryDto) {
    return this.service.list(query);
  }

  @Post(':userId/ban')
  ban(@CurrentUser() user: AuthUser, @Param('userId', ParseIntPipe) userId: number) {
    return this.service.ban(Number(user.userId), userId);
  }

  @Post(':userId/unban')
  unban(@CurrentUser() user: AuthUser, @Param('userId', ParseIntPipe) userId: number) {
    return this.service.unban(Number(user.userId), userId);
  }
}