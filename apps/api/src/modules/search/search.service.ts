import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { ProductStatus } from '../products/constants/product-status.enum';
import { SearchQueryDto, SearchSort } from './dto/search-query.dto';
import {
  HotKeywordDto,
  SearchResultDto,
  SearchSpuRow,
  toSearchResult,
} from './dto/search-result.dto';

const HOTWORDS_KEY = 'search:hotwords';
const MAX_SEARCH_RESULTS = 10000;
const DEFAULT_SUGGEST_LIMIT = 10;
const DEFAULT_HOT_LIMIT = 20;

const SEARCH_INCLUDE = {
  skus: { select: { price: true } },
} satisfies Prisma.SpuInclude;

type ScoredSpu = { spu: SearchSpuRow; minPrice: number; score: number };

export abstract class SearchService {
  abstract searchProducts(query: SearchQueryDto): Promise<SearchResultDto[]>;
  abstract suggest(prefix: string, limit?: number): Promise<string[]>;
  abstract getHotKeywords(limit?: number): Promise<HotKeywordDto[]>;
}

@Injectable()
export class PostgresSearchService extends SearchService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {
    super();
  }

  async searchProducts(query: SearchQueryDto): Promise<SearchResultDto[]> {
    const keyword = query.keyword?.trim();

    const where: Prisma.SpuWhereInput = {
      deletedAt: null,
      status: ProductStatus.ON_SALE,
    };
    if (keyword) {
      where.title = { contains: keyword, mode: 'insensitive' };
    }
    if (query.categoryId !== undefined) where.categoryId = query.categoryId;
    if (query.brandId !== undefined) where.brandId = query.brandId;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      const skuWhere: Prisma.SkuWhereInput = {
        price: {
          ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
          ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
        },
      };
      where.skus = { some: skuWhere };
    }

    const spus = await this.prisma.spu.findMany({
      where,
      include: SEARCH_INCLUDE,
      take: MAX_SEARCH_RESULTS,
    });

    const scored: ScoredSpu[] = spus.map((spu) => ({
      spu,
      minPrice: this.minSkuPrice(spu),
      score: spu.salesCount * 0.7 + spu.ratingAvg.toNumber() * 100 * 0.3,
    }));

    scored.sort((a, b) => this.compare(a, b, query.sort ?? 'default'));

    const pageSize = query.pageSize ?? 20;
    const start = ((query.page ?? 1) - 1) * pageSize;
    const pageItems = scored.slice(start, start + pageSize);

    if (keyword) {
      await this.redis.zIncrBy(HOTWORDS_KEY, 1, keyword).catch(() => undefined);
    }

    return pageItems.map((item) => toSearchResult(item.spu, item.minPrice));
  }

  async suggest(prefix: string, limit = DEFAULT_SUGGEST_LIMIT): Promise<string[]> {
    const p = prefix?.trim();
    if (!p) return [];

    const n = this.normalizeLimit(limit, DEFAULT_SUGGEST_LIMIT);
    const rows = await this.redis.zRevRange(HOTWORDS_KEY, 0, -1, true);
    const keywords: string[] = [];
    for (let i = 0; i < rows.length; i += 2) {
      keywords.push(rows[i]);
    }
    const lower = p.toLowerCase();
    return keywords.filter((k) => k.toLowerCase().startsWith(lower)).slice(0, n);
  }

  async getHotKeywords(limit = DEFAULT_HOT_LIMIT): Promise<HotKeywordDto[]> {
    const n = this.normalizeLimit(limit, DEFAULT_HOT_LIMIT);
    const rows = await this.redis.zRevRange(HOTWORDS_KEY, 0, n - 1, true);
    const result: HotKeywordDto[] = [];
    for (let i = 0; i + 1 < rows.length; i += 2) {
      result.push({ keyword: rows[i], score: Number(rows[i + 1]) });
    }
    return result;
  }

  private minSkuPrice(spu: SearchSpuRow): number {
    if (spu.skus.length === 0) return 0;
    return Math.min(...spu.skus.map((sku) => sku.price.toNumber()));
  }

  private compare(a: ScoredSpu, b: ScoredSpu, sort: SearchSort): number {
    switch (sort) {
      case 'sales':
        return b.spu.salesCount - a.spu.salesCount;
      case 'price_asc':
        return a.minPrice - b.minPrice;
      case 'price_desc':
        return b.minPrice - a.minPrice;
      case 'newest':
        return b.spu.createdAt.getTime() - a.spu.createdAt.getTime();
      default:
        return b.score - a.score;
    }
  }

  private normalizeLimit(limit: number | undefined, fallback: number): number {
    if (limit === undefined || !Number.isFinite(limit) || limit <= 0) return fallback;
    return Math.floor(limit);
  }
}
