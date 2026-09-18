import { ApiProperty } from '@nestjs/swagger';

export class RefundResponseDto {
  @ApiProperty({ description: '退款单 id' })
  id!: number;

  @ApiProperty({ description: '退款单号' })
  refundNo!: string;

  @ApiProperty({ description: '订单 id' })
  orderId!: number;

  @ApiProperty({ description: '订单号' })
  orderNo!: string;

  @ApiProperty({ description: '用户 id' })
  userId!: number;

  @ApiProperty({ description: '退款金额（元，两位小数）' })
  amount!: string;

  @ApiProperty({ description: '退款原因' })
  reason!: string;

  @ApiProperty({ description: '状态：0待处理 2已拒绝 3已退款' })
  status!: number;

  @ApiProperty({ description: '第三方退款流水号', nullable: true, type: String })
  thirdPartyNo!: string | null;

  @ApiProperty({ description: '创建时间', type: Date })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间', type: Date })
  updatedAt!: Date;
}
