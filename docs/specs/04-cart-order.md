# P4 购物车与订单

## 已确定的决策（不要再问）
- 超时关单用定时任务轮询（@nestjs/schedule），不用 RabbitMQ
- 购物车登录用户存数据库，未登录前端本地存
- 订单拆单：一购物车多店铺 → 多订单，一次支付
- 库存：下单锁 lockedStock，支付扣 stock，取消/超时释放 lockedStock
- 订单号：yyyyMMddHHmmss + 6 位随机数
- 金额字段用 Prisma.Decimal，输出 toFixed(2)

## 数据表（Prisma）

Cart 表字段：
id, userId, shopId, skuId, quantity, selected（默认 true）, createdAt, updatedAt
索引：unique(userId, skuId)，index(userId)

Order 表字段：
id, orderNo（unique）, userId, shopId, totalAmount, payAmount, freightAmount, discountAmount, status（Int）, payStatus, shipStatus, receiverJson, buyerRemark, channel, createdAt, paidAt, shippedAt, finishedAt, closedAt
索引：index(userId, status, createdAt)，index(orderNo)
status 取值：0待付款 1已付款 2已发货 3已收货 4已完成 5已关闭 6已取消

OrderItem 表字段：
id, orderId, spuId, skuId, spuTitle, skuSpec（JSON）, skuImage, price, quantity, total, refundStatus（0无/1申请中/2已退款）, createdAt
索引：index(orderId)

## 接口

购物车（需登录）：
GET /cart —— 列表（按店铺分组）
POST /cart/items —— 加购（同 SKU 数量累加）
PATCH /cart/items/:id —— 改数量或勾选
DELETE /cart/items/:id —— 删除单项
DELETE /cart/invalid —— 清空失效项

订单（需登录）：
POST /orders/preview —— 价格试算
POST /orders —— 创建订单
GET /orders —— 订单列表（分页、status 筛选）
GET /orders/:orderNo —— 订单详情
POST /orders/:orderNo/cancel —— 取消订单

## 业务规则

购物车：
- 同 SKU 重复加购数量累加，不超过库存
- 加购时校验 SKU 状态、SPU 状态
- 失效项（SKU 下架或库存 0）返回时标记 isInvalid=true

价格试算 /orders/preview：
- 入参：addressId + items 数组（每项含 cartId 或 skuId+quantity）
- 出参字段：totalAmount, freightAmount, discountAmount, payAmount, items, shopGroups
- shopGroups 数组每项：shopId, amount, items
- 所有金额字段为字符串，保留 2 位小数

创建订单 /orders：
- 入参：addressId, items, buyerRemark（可选）
- 流程（事务内，严格按序）：
  1. 校验地址属于当前用户
  2. 校验每个 SKU 状态、SPU 状态、库存
  3. 按 shopId 分组（拆单）
  4. 计算每个订单金额
  5. 每个订单：生成 orderNo → 写 Order + OrderItem → 锁库存
  6. 清空对应购物车项
  7. 返回订单列表

库存乐观锁（必须用 prisma.$executeRaw）：
- SQL：UPDATE skus SET locked_stock = locked_stock + N WHERE id = ? AND stock - locked_stock >= N
- 影响行数为 0 时抛「库存不足」异常

幂等：
- 客户端传 X-Request-Id header
- 服务端用 Redis 缓存 5 分钟，重复请求返回缓存结果

取消订单 /orders/:orderNo/cancel：
- 仅 PENDING_PAY 可取消
- 事务内：status=CANCELLED，释放 lockedStock

超时关单：
- @nestjs/schedule 的 @Cron('*/5 * * * *') 每 5 分钟扫一次
- 条件：status=PENDING_PAY 且 createdAt < now - 30 分钟
- 改 status=CLOSED，释放 lockedStock

## 参考模板
- Controller: apps/api/src/modules/products/products.controller.ts
- Service（含事务）: apps/api/src/modules/products/seller-products.service.ts
- DTO: apps/api/src/modules/products/dto/create-product.dto.ts
- 分页: apps/api/src/common/dto/pagination-query.dto.ts
- 单测: apps/api/test/unit/seller-products.service.spec.ts

## 单测要求
- cart.service：加购（累加、超库存）、改数量、删除、失效项
- order.service：preview 价格、createOrder 拆单、库存不足抛异常、幂等、cancel 释放库存

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 P2 商品模块的目录结构