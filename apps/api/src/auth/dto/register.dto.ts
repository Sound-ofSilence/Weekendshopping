import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches, MaxLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: '13800138000' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone!: string;

  @ApiProperty({ example: '123456' })
  @Matches(/^\d{6}$/, { message: '验证码为6位数字' })
  smsCode!: string;

  @ApiProperty({ example: 'abc12345' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,20}$/, { message: '密码需8-20位且同时包含字母和数字' })
  password!: string;

  @ApiPropertyOptional({ example: 'nickname' })
  @IsOptional()
  @MaxLength(30, { message: '昵称最长30个字符' })
  nickname?: string;
}
