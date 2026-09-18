按 docs/specs/05-payment.md 实现 P5a 支付模块（支付单 + 回调 + Mock 支付服务）。

【严格约束】
1. 只读 3 个文件：
   - docs/specs/05-payment.md
   - apps/api/src/modules/orders/orders.service.ts（学事务 + 乐观锁写法）
   - apps/api/src/app.module.ts（看模块注册）
2. 禁止读其他文件、禁止跑命令、禁止 search_codebase
3. 只做支付（Payment 表 + PayService + 3 个接口），不做退款（Refund）

【上下文】（不要读，直接用）
- @CurrentUser() 返回 AuthUser { userId: string, role }，用 Number(user.userId)
- 异常：throw new AppException(ErrorCode.XXX, 'msg')
- 事务：await this.prisma.$transaction(async (tx) => { ... })
- 乐观锁：await tx.$executeRaw`UPDATE skus SET stock = stock - ${qty}, locked_stock = locked_stock - ${qty} WHERE id = ${skuId} AND locked_stock >= ${qty}`
- Redis 幂等：RedisService.get(key) / set(key, value, ttlSeconds)
- 金额：Prisma.Decimal，输出 toFixed(2)
- 订单号规则参考 P4：P + yyyyMMddHHmmss + 6 位随机

【交付物（7 个文件）】
1. Prisma schema：新增 Payment 表（不动其他表）
2. src/modules/payments/pay.service.ts（抽象接口 + MockPayService 实现）
3. src/modules/payments/payments.service.ts（创建支付单 + 查询 + mock-pay + 回调处理）
4. src/modules/payments/payments.controller.ts（4 个接口，其中 /payments/notify/mock 加 @Public）
5. src/modules/payments/payments.module.ts
6. src/modules/payments/dto/create-payment.dto.ts
7. src/modules/payments/dto/payment-response.dto.ts
8. apps/api/src/app.module.ts（追加 PaymentsModule）

【业务要点】
- 创建支付单：校验订单属于同一用户、状态为 PENDING_PAY，计算总额
- 回调幂等：Redis key = `payment:notify:${paymentNo}`，TTL 300 秒
- 回调事务内：更新 Payment → 更新 Order 状态 → 扣减库存
- MockPayService：createPayment 生成假流水号 'MOCK' + 时间戳 + 随机数

【输出方式】
直接写文件，不要在对话里贴代码。
完成后只回复：「完成。改了 N 个文件」