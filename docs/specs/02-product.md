# P2 商品模块

## 数据库（Prisma）

### Category（类目）
- id (Int, PK)
- parentId (Int?, 0 或 null 表示一级)
- name (String)
- level (Int, 1/2/3)
- sort (Int, default 0)
- icon (String?)
- isLeaf (Boolean, default false)
- status (Int, 1启用/0禁用)
- createdAt, updatedAt, deletedAt
- @@index([parentId, status])

### Brand（品牌）
- id (Int, PK)
- name (String, unique)
- logo (String?)
- status (Int, 1启用/0禁用)
- createdAt, updatedAt, deletedAt

### Spu（商品）
- id (Int, PK)
- shopId (Int, 一期先固定为 1，占位；P9 商家模块再真接入)
- categoryId (Int, FK)
- brandId (Int?)
- title (String, 5-60字)
- subtitle (String?)
- mainImg (String)
- imagesJson (Json, 图片URL数组)
- detailHtml (String, @db.Text)
- status (Int, 见下方状态枚举)
- auditStatus (Int, 0待审/1通过/2驳回)
- auditReason (String?)
- salesCount (Int, default 0)
- ratingAvg (Decimal, @db.Decimal(3,2), default 5.0)
- createdAt, updatedAt, deletedAt
- @@index([shopId, status])
- @@index([categoryId, status])

Spu.status 枚举：
- 0 DRAFT 草稿
- 1 PENDING_AUDIT 待审核
- 2 ON_SALE 上架
- 3 OFF_SALE 下架
- 4 REJECTED 驳回

### Sku（SKU）
- id (Int, PK)
- spuId (Int, FK)
- specJson (Json, 如 {颜色:"黑色", 尺码:"M"})
- skuCode (String?, unique)
- price (Decimal, @db.Decimal(10,2))
- marketPrice (Decimal?, @db.Decimal(10,2))
- costPrice (Decimal?, @db.Decimal(10,2))
- stock (Int, default 0)
- lockedStock (Int, default 0)
- warnStock (Int, default 0)
- image (String?)
- status (Int, 1启用/0禁用)
- weight (Decimal?, @db.Decimal(10,2), 克)
- volume (Decimal?, @db.Decimal(10,2), 立方厘米)
- createdAt, updatedAt
- @@index([spuId])

### SpuSpec（SPU 的规格定义，如"颜色"/"尺码"）
- id (Int, PK)
- spuId (Int, FK)
- name (String, 如"颜色")
- valuesJson (Json, 如 ["黑色","白色","灰色"])
- sort (Int, default 0)
- @@index([spuId])

## 接口

### 类目/品牌（公开）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /categories/tree | 完整类目树 |
| GET | /categories/:id/children | 某类目的子类目 |
| GET | /brands | 品牌列表（分页） |

### 商品（公开 + 商家）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /products/:spuId | 商品详情（含 SKU、规格） |
| GET | /products/:spuId/skus | SKU 列表 |
| GET | /seller/products | 商家商品列表（分页、筛选） |
| POST | /seller/products | 发布商品（草稿） |
| PUT | /seller/products/:id | 编辑商品 |
| POST | /seller/products/:id/submit | 提交审核 |
| POST | /seller/products/:id/on-sale | 上架（管理员审核通过后） |
| POST | /seller/products/:id/off-sale | 下架 |
| DELETE | /seller/products/:id | 删除（软删） |
| POST | /seller/products/batch-on-sale | 批量上架 |
| POST | /seller/products/batch-off-sale | 批量下架 |

## 业务规则

### 商品发布
- 标题 5-60 字
- 必须选叶子类目（isLeaf=true）
- 主图 1 张必填
- 至少 1 个 SKU
- 每个 SKU 必须有价格和库存
- 发布后状态 = DRAFT（草稿），不直接上架

### SKU 生成
- 商家在规格组（如 颜色、尺码）填入所有可能值
- 前端调用接口生成笛卡尔积 SKU 列表
- 商家给每个 SKU 填价格、库存、编码
- 保存时校验：每个 SKU 的 price > 0、stock >= 0

### 库存乐观锁（关键）
下单时：