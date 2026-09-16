import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, Matches, MaxLength } from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: '张三' })
  @IsNotEmpty({ message: '收货人不能为空' })
  @MaxLength(50, { message: '收货人最长50个字符' })
  receiver!: string;

  @ApiProperty({ example: '13800138000' })
  @Matches(/^1[3-9]\d{9}$/, { message: '手机号格式不正确' })
  phone!: string;

  @ApiProperty({ example: '浙江省' })
  @IsNotEmpty({ message: '省份不能为空' })
  province!: string;

  @ApiProperty({ example: '杭州市' })
  @IsNotEmpty({ message: '城市不能为空' })
  city!: string;

  @ApiProperty({ example: '西湖区' })
  @IsNotEmpty({ message: '区县不能为空' })
  district!: string;

  @ApiProperty({ example: '文一西路 100 号' })
  @IsNotEmpty({ message: '详细地址不能为空' })
  detail!: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean({ message: 'isDefault 需为布尔值' })
  isDefault?: boolean;

  @ApiPropertyOptional({ example: '家' })
  @IsOptional()
  @MaxLength(10, { message: '标签最长10个字符' })
  tag?: string;
}
