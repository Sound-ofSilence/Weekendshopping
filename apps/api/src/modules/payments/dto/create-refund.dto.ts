import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Matches, Min } from 'class-validator';

export class CreateRefundDto {
  @ApiProperty({ description: '订单 id' })
  @IsInt()
  @Min(1)
  orderId!: number;

  @ApiProperty({ description: '退款金额（元，两位小数）' })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+(\.\d{1,2})?$/, { message: '金额格式不正确' })
  amount!: string;

  @ApiProperty({ description: '退款原因' })
  @IsString()
  @IsNotEmpty()
  reason!: string;
}
