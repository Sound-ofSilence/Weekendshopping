import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateRefundDto } from './dto/create-refund.dto';
import { RefundResponseDto } from './dto/refund-response.dto';
import { RefundsService } from './refunds.service';

@ApiTags('refunds')
@UseGuards(JwtAuthGuard)
@Controller('refunds')
export class RefundsController {
  constructor(private readonly refundsService: RefundsService) {}

  @Post()
  @ApiOperation({ summary: '申请退款' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateRefundDto,
  ): Promise<RefundResponseDto> {
    return this.refundsService.create(user.userId, dto);
  }

  @Post(':refundNo/approve')
  @ApiOperation({ summary: '同意退款' })
  approve(
    @CurrentUser() user: AuthUser,
    @Param('refundNo') refundNo: string,
  ): Promise<RefundResponseDto> {
    return this.refundsService.approve(user.userId, refundNo);
  }

  @Post(':refundNo/reject')
  @ApiOperation({ summary: '拒绝退款' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('refundNo') refundNo: string,
  ): Promise<RefundResponseDto> {
    return this.refundsService.reject(user.userId, refundNo);
  }

  @Get(':refundNo')
  @ApiOperation({ summary: '退款单详情' })
  detail(
    @CurrentUser() user: AuthUser,
    @Param('refundNo') refundNo: string,
  ): Promise<RefundResponseDto> {
    return this.refundsService.detail(user.userId, refundNo);
  }
}
