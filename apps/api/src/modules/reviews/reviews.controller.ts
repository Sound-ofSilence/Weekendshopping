import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PaginatedResponseDto } from '../../common/dto/paginated-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthUser } from '../../common/interfaces/auth-user.interface';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewResponseDto } from './dto/review-response.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('reviews')
@UseGuards(JwtAuthGuard)
@Controller()
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post('reviews')
  @ApiOperation({ summary: '发表评价' })
  create(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.create(user.userId, dto);
  }

  @Get('reviews')
  @ApiOperation({ summary: '我的评价（分页、状态/评分筛选）' })
  listMine(
    @CurrentUser() user: AuthUser,
    @Query() query: ReviewQueryDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    return this.reviewsService.listByUser(user.userId, query);
  }

  @Get('products/:spuId/reviews')
  @Public()
  @ApiOperation({ summary: '商品评价列表（公开，分页+筛选）' })
  listByProduct(
    @Param('spuId') spuId: string,
    @Query() query: ReviewQueryDto,
  ): Promise<PaginatedResponseDto<ReviewResponseDto>> {
    return this.reviewsService.listByProduct(spuId, query);
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: '删除自己的评价' })
  remove(@CurrentUser() user: AuthUser, @Param('id') id: string): Promise<null> {
    return this.reviewsService.remove(user.userId, id);
  }
}
