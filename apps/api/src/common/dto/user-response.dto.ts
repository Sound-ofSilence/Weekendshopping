import { ApiProperty } from '@nestjs/swagger';
import type { User } from '@prisma/client';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: '13800138000' })
  phone!: string;

  @ApiProperty({ example: 'user@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ example: 'nickname', nullable: true })
  nickname!: string | null;

  @ApiProperty({ example: 'https://cdn.example.com/avatar.png', nullable: true })
  avatar!: string | null;

  @ApiProperty({ example: 1, enum: [0, 1, 2], nullable: true })
  gender!: number | null;

  @ApiProperty({ example: '1990-01-01T00:00:00.000Z', nullable: true })
  birthday!: Date | null;

  @ApiProperty({ example: 1 })
  status!: number;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  createdAt!: Date;

  @ApiProperty({ example: '2026-09-17T00:00:00.000Z' })
  updatedAt!: Date;
}

/** 将 Prisma User 实体转为响应对象（永不返回 passwordHash / deletedAt）。 */
export function toUserResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    phone: user.phone,
    email: user.email,
    nickname: user.nickname,
    avatar: user.avatar,
    gender: user.gender,
    birthday: user.birthday,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}
