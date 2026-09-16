import { HttpStatus, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ErrorCode } from '../../common/constants/error-codes';
import { toUserResponse, UserResponseDto } from '../../common/dto/user-response.dto';
import { AppException } from '../../common/exceptions/app.exception';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: number): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new AppException(ErrorCode.NOT_FOUND, '用户不存在', HttpStatus.NOT_FOUND);
    }
    return toUserResponse(user);
  }

  async updateMe(userId: number, dto: UpdateProfileDto): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt) {
      throw new AppException(ErrorCode.NOT_FOUND, '用户不存在', HttpStatus.NOT_FOUND);
    }

    const data: Prisma.UserUpdateInput = {};
    if (dto.nickname !== undefined) data.nickname = dto.nickname;
    if (dto.avatar !== undefined) data.avatar = dto.avatar;
    if (dto.gender !== undefined) data.gender = dto.gender;
    if (dto.email !== undefined) data.email = dto.email;
    if (dto.birthday !== undefined) data.birthday = new Date(dto.birthday);

    const updated = await this.prisma.user.update({ where: { id: userId }, data });
    return toUserResponse(updated);
  }
}
