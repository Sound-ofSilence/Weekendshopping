import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserResponseDto } from '../../common/dto/user-response.dto';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户' })
  getMe(@CurrentUser() user: AuthUser): Promise<UserResponseDto> {
    return this.usersService.getMe(Number(user.userId));
  }

  @Patch('me')
  @ApiOperation({ summary: '更新资料' })
  updateMe(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto): Promise<UserResponseDto> {
    return this.usersService.updateMe(Number(user.userId), dto);
  }
}
