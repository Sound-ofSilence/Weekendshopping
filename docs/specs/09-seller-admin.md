# P9 商家后台接口

## 已确定的决策（不要再问）
- 商家 shopId 一期固定 DEFAULT_SHOP_ID=1（P2 一直沿用，P9 不改）
- 商家后台只做数据聚合和查询，不做业务逻辑变更（业务已在 P2/P4/P7b/P8 实现）
- 结算一期简化：T+1 结算，商户可提现到银行卡
- 提现走 Mock（不真实调用银行接口）
- 子账号一期不做

## 数据表（Prisma）

### Settlement（结算单）
字段：
- id (Int, PK)
- settlementNo (String, unique) —— 规则：S + yyyyMMddHHmmss + 6 位随机
- shopId (Int)
- periodStart (DateTime)
- periodEnd (DateTime)
- orderAmount (Decimal 12,2) —— 订单总额
- commission (Decimal 12,2) —— 平台佣金
- refundAmount (Decimal 12,2) —— 退款总额
- payable (Decimal 12,2) —— 应结算金额 = orderAmount - commission - refundAmount
- status (Int) —— 0待结算 1已结算 2已提现
- settledAt (DateTime?)
- createdAt, updatedAt
- 索引：unique(settlementNo), index(shopId, status), index(periodStart, periodEnd)

### Withdrawal（提现申请）
字段：
- id (Int, PK)
- withdrawalNo (String, unique) —— 规则：W + yyyyMMddHHmmss + 6 位随机
- shopId (Int)
- amount (Decimal 12,2)
- bankName (String)
- bankAccount (String)
- accountHolder (String)
- status (Int) —— 0申请中 1已通过 2已拒绝 3已打款
- remark (String?)
- reviewedAt (DateTime?)
- createdAt, updatedAt
- 索引：unique(withdrawalNo), index(shopId, status)

### ShopWallet（店铺钱包）
字段：
- id (Int, PK)
- shopId (Int, unique)
- balance (Decimal 12,2, default 0) —— 可用余额
- frozenBalance (Decimal 12,2, default 0) —— 冻结余额
- totalIncome (Decimal 12,2, default 0) —— 累计收入
- totalWithdrawn (Decimal 12,2, default 0) —— 累计提现
- updatedAt
- 索引：unique(shopId)

## 接口

### 工作台（商家）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /seller/dashboard/stats | 今日/7日/30日数据聚合（订单数/销售额/待发货/待售后） |
| GET | /seller/dashboard/sales-trend | 近 7 日销售趋势（按日聚合） |
| GET | /seller/dashboard/top-products | 销售 TOP 10 商品 |

### 订单管理（商家，补充 P4）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /seller/orders | 商家订单列表（按 shopId 筛选，分页） |
| GET | /seller/orders/:orderNo | 订单详情 |
| POST | /seller/orders/:orderNo/ship | 发货（已实现） |

### 售后（商家，已在 P7b 实现，不重复）

### 财务（商家）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /seller/wallet | 查看钱包（余额/冻结/累计收入） |
| GET | /seller/settlements | 结算单列表 |
| GET | /seller/withdrawals | 提现记录 |
| POST | /seller/withdrawals | 申请提现（入参：amount, bankName, bankAccount, accountHolder） |

### 数据统计（商家）
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /seller/analytics/products | 商品分析（曝光/点击/加购/下单/支付漏斗） |
| GET | /seller/analytics/traffic | 流量分析（UV/PV/来源） |

## 业务规则

### 工作台
- 数据范围：只统计当前商家的（shopId=DEFAULT_SHOP_ID）
- 今日订单：status >= 1（已付款）的订单数
- 待发货：status=1（已付款未发货）
- 待售后：AfterSale.status=0（待商家处理）
- 今日销售额：status >= 1 的订单 payAmount 总和

### 销售趋势
- 按日聚合近 7 天
- 每天返回：date, orderCount, salesAmount

### TOP 商品
- 按 OrderItem.quantity 聚合，取 TOP 10

### 结算
- 一期简化：不跑定时任务生成，由商家后台手动触发"申请结算"或运营在 P10 生成
- 结算单金额：orderAmount = 同期该商家所有已完成订单的 payAmount 总和

### 提现
- 申请条件：wallet.balance >= amount
- 事务内：wallet.balance -= amount, wallet.frozenBalance += amount, 创建 Withdrawal 记录
- 商家点击"提现"后，运营在 P10 后台审核 → 通过后打款

### 钱包初始化
- 商家首次访问时，如果没有钱包记录，自动创建 balance=0 的记录
- 一期不做自动加钱，等 P10 平台模块统一处理

### 数据统计
- 一期用 PG 简单聚合，不做埋点
- 曝光/点击暂时不统计（没有埋点数据），只统计加购/下单/支付
- 加购：Cart 表按 shopId 统计
- 下单：Order 表按 shopId 统计
- 支付：Order.status >= 1

## 参考模板
- Controller: apps/api/src/modules/orders/orders.controller.ts
- Service: apps/api/src/modules/orders/orders.service.ts
- DTO: apps/api/src/modules/orders/dto/create-order.dto.ts
- 单测: apps/api/test/unit/order.service.spec.ts

## 单测要求
- dashboard.service：数据聚合正确（mock Prisma）
- wallet.service：提现申请（余额不足抛异常）+ 钱包初始化
- settlement.service：结算单查询

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 orders 模块结构