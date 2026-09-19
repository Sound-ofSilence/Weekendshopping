import { Controller, Delete, Get, Param, ParseIntPipe, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { NotificationService } from './notification.service';
import { NotificationQueryDto } from './dto/notification-query.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private service: NotificationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: NotificationQueryDto) {
    return this.service.list(Number(user.userId), query);
  }

  @Get('unread-count')
  unreadCount(@CurrentUser() user: AuthUser) {
    return this.service.unreadCount(Number(user.userId));
  }

  @Post(':id/read')
  markRead(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.markRead(Number(user.userId), id);
  }

  @Post('read-all')
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.service.markAllRead(Number(user.userId));
  }

  @Delete(':id')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseIntPipe) id: number) {
    return this.service.remove(Number(user.userId), id);
  }
}