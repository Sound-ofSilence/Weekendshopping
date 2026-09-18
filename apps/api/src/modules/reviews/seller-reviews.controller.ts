import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from '../../common/constants/roles.enum';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('seller-reviews')
@UseGuards(JwtAuthGuard)
@Controller('seller/reviews')
export class SellerReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post(':id/reply')
  @Roles(Role.MERCHANT)
  @ApiOperation({ summary: '商家回复评价' })
  sellerReply(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body('content') content?: string,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.sellerReply(user.userId, id, content ?? '');
  }
}
