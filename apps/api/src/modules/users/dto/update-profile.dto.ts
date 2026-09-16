import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEmail, IsIn, IsISO8601, IsOptional, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'nickname' })
  @IsOptional()
  @MaxLength(30, { message: '昵称最长30个字符' })
  nickname?: string;

  @ApiPropertyOptional({ example: 'https://cdn.example.com/avatar.png' })
  @IsOptional()
  @MaxLength(255, { message: '头像地址过长' })
  avatar?: string;

  @ApiPropertyOptional({ enum: [0, 1, 2], description: '0未知/1男/2女' })
  @IsOptional()
  @Type(() => Number)
  @IsIn([0, 1, 2], { message: '性别取值仅支持 0/1/2' })
  gender?: number;

  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsOptional()
  @IsEmail({}, { message: '邮箱格式不正确' })
  email?: string;

  @ApiPropertyOptional({ example: '1990-01-01' })
  @IsOptional()
  @IsISO8601({}, { message: '生日格式不正确' })
  birthday?: string;
}
