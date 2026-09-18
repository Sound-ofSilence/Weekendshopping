# P8 营销模块

## 已确定的决策（不要再问）
- 优惠叠加优先级：秒杀价 > 会员价（不做）> 店铺券 > 平台券 > 满减
- 券和满减是否可叠加：按 spec 优先级，同类只用一个（一张店铺券 + 一张平台券 + 一个满减活动）
- 秒杀用独立库存，不影响主库存（防止秒杀拖累正常销售）
- 优惠金额用 Prisma.Decimal，不用 float

## 数据表（Prisma）

### Coupon（优惠券）
字段：
- id (Int, PK)
- shopId (Int?) —— null 表示平台券
- name (String)
- type (Int) —— 1满减 2折扣
- value (Decimal 10,2) —— 满减金额 或 折扣百分比（如 8.5 表示 85 折）
- minAmount (Decimal 10,2) —— 使用门槛
- totalCount (Int)
- receivedCount (Int, default 0)
- usedCount (Int, default 0)
- perUserLimit (Int, default 1)
- startAt (DateTime)
- endAt (DateTime)
- status (Int) —— 1启用 0禁用
- createdAt, updatedAt
- 索引：index(shopId, status), index(startAt, endAt)

### UserCoupon（用户券）
字段：
- id (Int, PK)
- userId (Int)
- couponId (Int)
- orderId (Int?) —— 使用后关联
- status (Int) —— 0未使用 1已使用 2已过期
- receivedAt (DateTime)
- usedAt (DateTime?)
- expiredAt (DateTime) —— 券的到期时间快照
- 索引：index(userId, status), unique(userId, couponId, receivedAt)

### Promotion（满减活动）
字段：
- id (Int, PK)
- shopId (Int)
- name (String)
- rulesJson (Json) —— 如 [{min: 200, reduce: 30}, {min: 500, reduce: 100}]
- startAt (DateTime)
- endAt (DateTime)
- status (Int) —— 1启用 0禁用
- createdAt, updatedAt
- 索引：index(shopId, status), index(startAt, endAt)

### SeckillActivity（秒杀场次）
字段：
- id (Int, PK)
- name (String) —— 如"10点场"
- startAt (DateTime)
- endAt (DateTime)
- status (Int) —— 1启用 0禁用
- createdAt, updatedAt

### SeckillProduct（秒杀商品）
字段：
- id (Int, PK)
- activityId (Int)
- skuId (Int)
- seckillPrice (Decimal 10,2)
- stock (Int)
- soldCount (Int, default 0)
- limitPerUser (Int, default 1)
- 索引：unique(activityId, skuId), index(skuId)

## 接口

### P8a 优惠券
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /seller/coupons | 商家创建券 |
| GET | /seller/coupons | 商家券列表 |
| POST | /coupons/:id/receive | 买家领券 |
| GET | /coupons/my | 我的券（可用/已用/过期） |
| GET | /coupons/available | 下单时可用券（传 shopId + amount） |
| GET | /coupons | 领券中心（平台券 + 店铺券，公开） |

### P8b 满减 + 秒杀
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /seller/promotions | 商家创建满减 |
| GET | /seller/promotions | 商家满减列表 |
| POST | /seller/seckill/activities | 创建秒杀场次 |
| POST | /seller/seckill/products | 加秒杀商品 |
| GET | /seckill/activities | 秒杀场次列表（公开） |
| GET | /seckill/activities/:id/products | 场次商品（公开） |
| POST | /seckill/:skuId/buy | 参与秒杀下单 |

## 业务规则

### 优惠券
- 领券校验：status=1、在有效期内、receivedCount < totalCount、用户领取数 < perUserLimit
- 领券逻辑：事务内 receivedCount+1 + 插入 UserCoupon
- 用券校验：status=0、未过期、amount >= minAmount、shopId 匹配（平台券 shopId=null 通用）
- 用券：status=1 + orderId + usedAt，同时 coupon.usedCount+1
- 过期处理：定时任务每小时扫，把 expiredAt < now 且 status=0 的改为 2

### 满减
- 计算方式：取满足条件的最大一档（如 [{200:30},{500:100}]，订单 600 → 减 100）
- 不与券重复：一期先允许券 + 满减叠加（P12 再收紧）

### 秒杀
- 每场有 startAt/endAt，只在场次时间内的请求有效
- 每个用户每个 SKU 限购 limitPerUser 件
- 秒杀库存独立扣减（不扣主 SKU 库存）
- 秒杀下单复用 P4 的订单创建逻辑，但价格用 seckillPrice

### 价格计算优先级（关键）
创建订单时按顺序：
1. 若 SKU 在秒杀中 → 用 seckillPrice，跳过其他优惠
2. 否则：商品原价 → 满减 → 店铺券 → 平台券

## 参考模板
- Controller: apps/api/src/modules/orders/orders.controller.ts
- Service: apps/api/src/modules/orders/orders.service.ts
- DTO: apps/api/src/modules/orders/dto/create-order.dto.ts
- 单测: apps/api/test/unit/order.service.spec.ts

## 单测要求
- P8a：领券（各类校验）、用券、可用券查询
- P8b：满减计算（多档选最大）、秒杀库存扣减、秒杀价格优先级

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 orders 模块结构