import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ShipOrderDto {
  @ApiProperty({ description: '快递公司编码' })
  @IsString()
  @IsNotEmpty()
  expressCode!: string;

  @ApiProperty({ description: '快递公司名' })
  @IsString()
  @IsNotEmpty()
  expressCompany!: string;

  @ApiProperty({ description: '运单号' })
  @IsString()
  @IsNotEmpty()
  trackingNo!: string;
}

export class ShipOrderItemDto extends ShipOrderDto {
  @ApiProperty({ description: '订单号' })
  @IsString()
  @IsNotEmpty()
  orderNo!: string;
}
