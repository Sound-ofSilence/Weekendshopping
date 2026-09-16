import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, Matches, MaxLength } from 'class-validator';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: '张三' })
  @IsOptional()
  @MaxLength(50, { message: '收货人最长50个字符' })
  receiver?: string;

  @ApiPropertyOptional({ example: '13800138000' })
  @IsOptional()
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone?: string;

  @ApiPropertyOptional({ example: '浙江省' })
  @IsOptional()
  province?: string;

  @ApiPropertyOptional({ example: '杭州市' })
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: '西湖区' })
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ example: '文一西路 100 号' })
  @IsOptional()
  detail?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'isDefault 需为布尔值' })
  isDefault?: boolean;

  @ApiPropertyOptional({ example: '家' })
  @IsOptional()
  @MaxLength(10, { message: '标签最长10个字符' })
  tag?: string;
}
