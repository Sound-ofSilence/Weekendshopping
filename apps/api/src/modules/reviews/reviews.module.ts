import { Module } from '@nestjs/common';
import { ReviewsController } from './reviews.controller';
import { ReviewsService } from './reviews.service';
import { SellerReviewsController } from './seller-reviews.controller';

@Module({
  controllers: [ReviewsController, SellerReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
