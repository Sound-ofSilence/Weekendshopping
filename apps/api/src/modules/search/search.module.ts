import { Module } from '@nestjs/common';
import { RedisModule } from '../../redis/redis.module';
import { SearchController } from './search.controller';
import { PostgresSearchService, SearchService } from './search.service';

@Module({
  imports: [RedisModule],
  controllers: [SearchController],
  providers: [{ provide: SearchService, useClass: PostgresSearchService }],
  exports: [SearchService],
})
export class SearchModule {}
