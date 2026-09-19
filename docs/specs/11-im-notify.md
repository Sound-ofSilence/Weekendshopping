# P11 站内信与通知

## 已确定的决策（不要再问）
- 一期只做站内信（数据库持久化 + 接口），不做 WebSocket IM
- 短信 / 微信通知延后到 P12 或上线前（需要真实第三方账号）
- 系统通知用一个 Notification 表统一存

## 数据表（Prisma）

### Notification
字段：
- id (Int, PK)
- userId (Int)
- type (String) —— 如 order_paid / order_shipped / refund_approved / coupon_expiring / system
- title (String)
- content (String, @db.Text)
- link (String?) —— 前端跳转路径，如 /orders/OD123
- isRead (Boolean, default false)
- createdAt (DateTime)
- 索引：index(userId, isRead, createdAt), index(userId, type)

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /notifications | 我的通知列表（分页） |
| GET | /notifications/unread-count | 未读数 |
| POST | /notifications/:id/read | 标记已读 |
| POST | /notifications/read-all | 全部已读 |
| DELETE | /notifications/:id | 删除单条 |

## 业务规则
- 只查当前用户的通知
- 未读数统计：isRead=false 的条数
- 通知由后端在关键事件时自动创建（如订单发货 → 给买家发通知）

## 通知触发场景（一期手动挂到已有事件）
在 P4/P5/P6/P7 的关键 service 里加一行调用 NotificationService.create()：
- 订单支付成功 → 买家：订单已付款
- 商家发货 → 买家：订单已发货
- 退款成功 → 买家：退款已到账
- 售后被拒绝 → 买家：售后被拒绝

一期只在"退款成功"和"订单发货"两个场景加上通知，作为样例。
其他场景留待 P12 统一挂。

## 参考模板
- Controller: apps/api/src/modules/orders/orders.controller.ts
- Service: apps/api/src/modules/orders/orders.service.ts
- DTO: apps/api/src/modules/orders/dto/create-order.dto.ts
- 单测: apps/api/test/unit/order.service.spec.ts

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 orders 模块结构