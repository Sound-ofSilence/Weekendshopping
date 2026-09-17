# P3 搜索模块

## 已确定的决策（不要再问）
- 不用 Elasticsearch，用 PostgreSQL 全文搜索
- 用 pg_trgm 扩展 + GIN 索引
- SearchService 做抽象接口，方便以后切 ES
- 单测 mock PrismaService

## 接口
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /products/search | 搜索商品（分页） |
| GET | /search/suggest | 搜索联想 |
| GET | /search/hot-keywords | 热门词 TOP 20 |

## 业务规则
- 只返回 status=ON_SALE 且 deletedAt 为 null 的商品
- keyword 为空时按销量排序
- 每个商品返回：id、title、mainImg、price（最低 SKU 价）、salesCount、ratingAvg、shopId
- 排序 default：sales_count * 0.7 + rating_avg * 100 * 0.3 DESC
- 联想：Redis ZSet key=search:hotwords，ZINCRBY 累加
- 结果最多 10000 条

## 类型定义
export class SearchQueryDto {
  keyword?: string;
  categoryId?: number;
  brandId?: number;
  minPrice?: number;
  maxPrice?: number;
  sort?: 'default' | 'sales' | 'price_asc' | 'price_desc' | 'newest';
  page: number;
  pageSize: number;
}

export class SearchService {
  async searchProducts(query: SearchQueryDto);
  async suggest(prefix: string, limit?: number);
  async getHotKeywords(limit?: number);
}

## 数据库要求
- 迁移脚本启用 pg_trgm：CREATE EXTENSION IF NOT EXISTS pg_trgm;
- spus.title 加 GIN 索引：CREATE INDEX idx_spu_title_trgm ON spus USING GIN (title gin_trgm_ops);
- sales_count、rating_avg 加 B-tree 索引

## 参考模板
- Controller: src/modules/products/products.controller.ts
- Service: src/modules/products/products.service.ts
- DTO: src/modules/products/dto/product-query.dto.ts
- 单测: apps/api/test/unit/products.service.spec.ts

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
