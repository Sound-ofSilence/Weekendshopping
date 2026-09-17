import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SearchQueryDto } from './dto/search-query.dto';
import { HotKeywordDto, SearchResultDto } from './dto/search-result.dto';
import { SearchService } from './search.service';

@ApiTags('search')
@Controller()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Public()
  @Get('products/search')
  @ApiOperation({ summary: '搜索商品（分页）' })
  search(@Query() query: SearchQueryDto): Promise<SearchResultDto[]> {
    return this.searchService.searchProducts(query);
  }

  @Public()
  @Get('search/suggest')
  @ApiOperation({ summary: '搜索联想' })
  suggest(@Query('prefix') prefix: string, @Query('limit') limit?: string): Promise<string[]> {
    return this.searchService.suggest(prefix, this.toOptionalNumber(limit));
  }

  @Public()
  @Get('search/hot-keywords')
  @ApiOperation({ summary: '热门词 TOP 20' })
  hotKeywords(@Query('limit') limit?: string): Promise<HotKeywordDto[]> {
    return this.searchService.getHotKeywords(this.toOptionalNumber(limit));
  }

  private toOptionalNumber(value?: string): number | undefined {
    if (value === undefined || value === '') return undefined;
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : undefined;
  }
}
