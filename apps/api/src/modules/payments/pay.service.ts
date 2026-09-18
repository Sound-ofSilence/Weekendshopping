import { Injectable } from '@nestjs/common';

/** 支付单状态：0待支付 1支付成功 2支付失败 */
export const PaymentStatus = {
  PENDING: 0,
  SUCCESS: 1,
  FAILED: 2,
} as const;

/** 支付渠道抽象接口 */
export interface PayService {
  /** 发起支付，返回第三方交易流水号 */
  createPayment(orderNo: string, amount: string): Promise<string>;
}

/** PayService 注入 token */
export const PAY_SERVICE = Symbol('PAY_SERVICE');

/** Mock 支付服务：不真实调用第三方，直接生成假流水号 */
@Injectable()
export class MockPayService implements PayService {
  async createPayment(_orderNo: string, _amount: string): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1_000_000)
      .toString()
      .padStart(6, '0');
    return `MOCK${timestamp}${random}`;
  }
}
