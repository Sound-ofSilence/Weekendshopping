import { ApiProperty } from '@nestjs/swagger';

export class CouponResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty({ nullable: true }) shopId!: number | null;
  @ApiProperty() name!: string;
  @ApiProperty() type!: number;
  @ApiProperty() value!: string;
  @ApiProperty() minAmount!: string;
  @ApiProperty() totalCount!: number;
  @ApiProperty() receivedCount!: number;
  @ApiProperty() usedCount!: number;
  @ApiProperty() perUserLimit!: number;
  @ApiProperty() startAt!: Date;
  @ApiProperty() endAt!: Date;
  @ApiProperty() status!: number;
  @ApiProperty() createdAt!: Date;
  @ApiProperty() updatedAt!: Date;
}

export class UserCouponResponseDto {
  @ApiProperty() id!: number;
  @ApiProperty() userId!: number;
  @ApiProperty() couponId!: number;
  @ApiProperty({ nullable: true }) orderId!: number | null;
  @ApiProperty() status!: number;
  @ApiProperty() receivedAt!: Date;
  @ApiProperty({ nullable: true }) usedAt!: Date | null;
  @ApiProperty() expiredAt!: Date;
  @ApiProperty({ type: CouponResponseDto, required: false }) coupon?: CouponResponseDto;
}
