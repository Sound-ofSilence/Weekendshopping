import { ApiProperty } from '@nestjs/swagger';

export class PaymentResponseDto {
  @ApiProperty({ description: '支付单 id' })
  id!: number;

  @ApiProperty({ description: '支付单号' })
  paymentNo!: string;

  @ApiProperty({ description: '订单 id' })
  orderId!: number;

  @ApiProperty({ description: '订单号' })
  orderNo!: string;

  @ApiProperty({ description: '用户 id' })
  userId!: number;

  @ApiProperty({ description: '支付金额（元，两位小数）' })
  amount!: string;

  @ApiProperty({ description: '状态：0待支付 1成功 2失败' })
  status!: number;

  @ApiProperty({ description: '支付渠道' })
  channel!: number;

  @ApiProperty({ description: '第三方交易流水号', nullable: true, type: String })
  transactionNo!: string | null;

  @ApiProperty({ description: '支付成功时间', nullable: true, type: Date })
  paidAt!: Date | null;

  @ApiProperty({ description: '创建时间', type: Date })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间', type: Date })
  updatedAt!: Date;
}
