import { IsString, MaxLength } from 'class-validator';

export class CreatePaymentDto {
  /** 待支付订单号 */
  @IsString()
  @MaxLength(64)
  orderNo!: string;
}
