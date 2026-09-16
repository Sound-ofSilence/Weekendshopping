import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, Matches } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: '13800138000' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone!: string;

  @ApiPropertyOptional({ example: 'abc12345' })
  @IsOptional()
  password?: string;

  @ApiPropertyOptional({ example: '123456' })
  @IsOptional()
  @Matches(/^\d{6}$/, { message: '验证码为6位数字' })
  smsCode?: string;
}
