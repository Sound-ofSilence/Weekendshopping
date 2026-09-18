import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentResponseDto } from './dto/payment-response.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @ApiOperation({ summary: '创建支付单' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreatePaymentDto,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.create(user.userId, dto);
  }

  @Get(':paymentNo')
  @ApiOperation({ summary: '支付单详情' })
  detail(
    @CurrentUser() user: AuthUser,
    @Param('paymentNo') paymentNo: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.detail(user.userId, paymentNo);
  }

  @Post(':paymentNo/mock-pay')
  @ApiOperation({ summary: '模拟支付' })
  mockPay(
    @CurrentUser() user: AuthUser,
    @Param('paymentNo') paymentNo: string,
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.mockPay(user.userId, paymentNo);
  }

  @Public()
  @Post('notify/mock')
  @ApiOperation({ summary: 'Mock 支付回调' })
  notify(
    @Body() body: { paymentNo?: string; transactionNo?: string },
  ): Promise<PaymentResponseDto> {
    return this.paymentsService.handleNotify(body?.paymentNo ?? '', body?.transactionNo);
  }
}
