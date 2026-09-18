import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReviewResponseDto {
  @ApiProperty({ description: '评价 id' })
  id!: number;

  @ApiProperty({ description: '订单项 id' })
  orderItemId!: number;

  @ApiProperty({ description: '买家 userId' })
  userId!: number;

  @ApiProperty({ description: '商品 spuId' })
  spuId!: number;

  @ApiProperty({ description: 'SKU id' })
  skuId!: number;

  @ApiProperty({ description: '店铺 id' })
  shopId!: number;

  @ApiProperty({ description: '评分 1-5' })
  rating!: number;

  @ApiProperty({ description: '评价内容' })
  content!: string;

  @ApiProperty({ type: [String], description: '图片 URL 数组' })
  imagesJson!: string[];

  @ApiProperty({ description: '是否匿名' })
  isAnonymous!: boolean;

  @ApiPropertyOptional({ description: '商家回复' })
  sellerReply?: string | null;

  @ApiPropertyOptional({ description: '商家回复时间' })
  sellerReplyAt?: Date | null;

  @ApiProperty({ description: '状态 0待审核 1已发布 2已屏蔽' })
  status!: number;

  @ApiProperty({ description: '创建时间' })
  createdAt!: Date;

  @ApiProperty({ description: '更新时间' })
  updatedAt!: Date;
}
