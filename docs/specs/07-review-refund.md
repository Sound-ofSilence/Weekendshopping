# P7 评价与售后

## 已确定的决策（不要再问）
- 评价和售后是两件事，分别做两个子模块 P7a（评价）/ P7b（售后）
- 售后新建 AfterSale 表（业务层），同意后调 P4b 的 RefundService 创建退款单（钱）
- 敏感词过滤用内置黑名单（不做第三方审核，P12 再对接）
- 换货一期不做，只做「仅退款」和「退货退款」

## 数据表（Prisma）

### Review（评价）
字段：
- id（Int, PK）
- orderItemId（Int, unique）—— 一个订单项只能评价一次
- userId（Int）
- spuId（Int）
- skuId（Int）
- shopId（Int）
- rating（Int）—— 1-5 星
- content（String, @db.Text）
- imagesJson（Json）—— 图片 URL 数组，最多 9 张
- isAnonymous（Boolean, default false）
- sellerReply（String?, @db.Text）
- sellerReplyAt（DateTime?）
- status（Int）—— 0待审核 1已发布 2已屏蔽
- createdAt, updatedAt
- 索引：unique(orderItemId), index(spuId, status), index(userId), index(shopId)

### AfterSale（售后单）
字段：
- id（Int, PK）
- afterSaleNo（String, unique）—— 规则：AS + yyyyMMddHHmmss + 6 位随机
- orderId（Int）
- orderNo（String）
- orderItemId（Int）
- userId（Int）
- shopId（Int）
- type（Int）—— 1仅退款 2退货退款
- reason（String）
- description（String?, @db.Text）
- evidenceJson（Json?）—— 凭证图片
- amount（Decimal 10,2）
- status（Int）—— 0待商家处理 1商家同意 2商家拒绝 3待买家寄回 4买家已寄回 5商家已收货 6已退款 7已关闭 8平台介入
- returnTrackingNo（String?）—— 买家退货单号
- returnExpressCode（String?）
- sellerReply（String?）
- sellerReplyAt（DateTime?）
- refundNo（String?）—— 关联 P4b 的退款单号
- closedAt（DateTime?）
- createdAt, updatedAt
- 索引：unique(afterSaleNo), index(orderId), index(userId), index(shopId, status)

## 接口

### 评价（P7a）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /reviews | 发表评价 |
| GET | /products/:spuId/reviews | 商品评价列表（公开，分页+筛选） |
| GET | /orders/:orderNo/reviews | 我的订单评价（买家） |
| POST | /seller/reviews/:id/reply | 商家回复 |
| DELETE | /reviews/:id | 买家删除自己未审核的评价 |

### 售后（P7b）
| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /after-sales | 申请售后 |
| GET | /after-sales | 我的售后列表 |
| GET | /after-sales/:afterSaleNo | 售后详情 |
| POST | /after-sales/:afterSaleNo/cancel | 买家取消申请 |
| POST | /after-sales/:afterSaleNo/ship-back | 买家填退货单号 |
| POST | /seller/after-sales/:afterSaleNo/agree | 商家同意 |
| POST | /seller/after-sales/:afterSaleNo/reject | 商家拒绝 |
| POST | /seller/after-sales/:afterSaleNo/receive | 商家确认收到退货 |
| POST | /after-sales/:afterSaleNo/intervene | 买家申请平台介入 |

## 业务规则

### 评价
- 只有订单项状态为已收货(RECEIVED)或已完成(FINISHED)才能评价
- 一个订单项只能评价一次
- 收货后 15 天内可评价
- 评分 1-5，内容 ≤500 字，图片 ≤9 张
- 敏感词自动过滤（命中则 status=2 已屏蔽）
- 评价发布后更新 Spu.ratingAvg（加权平均）

### 售后
- 申请条件：
  * 仅退款：订单状态为 PAID 或 SHIPPED（未收货）
  * 退货退款：订单状态为 RECEIVED 或 FINISHED（已收货）
- 只有订单项 refundStatus = 0（未申请过）才能申请
- 退款金额 ≤ 订单项实付金额
- 状态机（严格按顺序）：
  仅退款：0待商家处理 → 1商家同意 → 6已退款（终态）
         0待商家处理 → 2商家拒绝 → 8平台介入 或 7已关闭
  退货退款：0 → 1商家同意 → 3待买家寄回 → 4买家已寄回 → 5商家已收货 → 6已退款
           0 → 2商家拒绝 → 8平台介入 或 7已关闭
- 商家 48 小时未处理，系统自动同意（定时任务）
- 同意仅退款：调 P4b 的 RefundService.createRefund() 创建退款单
- 同意退货退款：等买家寄回，商家确认收货后再调 RefundService
- 退款成功后更新 OrderItem.refundStatus = 2

### 敏感词
- 内置一个最小黑名单（20-50 个词，如"政治""赌博""诈骗"等）
- 命中则评价 status=2（已屏蔽），并返回提示

## 参考模板
- Controller: apps/api/src/modules/orders/orders.controller.ts
- Service: apps/api/src/modules/orders/orders.service.ts
- DTO: apps/api/src/modules/orders/dto/create-order.dto.ts
- 单测: apps/api/test/unit/order.service.spec.ts

## 单测要求
- Review：发布（校验订单状态）+ 敏感词过滤 + 商家回复
- AfterSale：申请（校验订单状态、金额）+ 商家同意（仅退款场景）+ 商家拒绝

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 orders 模块结构