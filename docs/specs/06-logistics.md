# P6 物流模块

## 已确定的决策（不要再问）
- 运费模板按「件数」计费（一期只做这个，重量/体积留 P12）
- 发货只支持快递，不支持虚拟发货
- 物流轨迹对接 mock 数据（不真实调第三方，P12 再对接快递100）
- 一期不做多仓

## 数据表（Prisma）

### FreightTemplate（运费模板）
字段：
- id（Int, PK）
- shopId（Int）
- name（String）
- chargeType（Int）—— 一期固定 1（按件）
- firstCount（Int）—— 首件数
- firstFee（Decimal 10,2）—— 首件运费
- extraCount（Int）—— 续件数
- extraFee（Decimal 10,2）—— 续件运费
- freeRegions（Json）—— 包邮地区列表
- excludedRegions（Json）—— 不发货地区
- status（Int）—— 1启用 0禁用
- createdAt, updatedAt
- 索引：index(shopId, status)

### Shipment（发货单）
字段：
- id（Int, PK）
- orderId（Int）
- orderNo（String）
- shopId（Int）
- expressCompany（String）—— 快递公司名
- expressCode（String）—— 快递公司编码
- trackingNo（String）—— 运单号
- status（Int）—— 0待揽收 1运输中 2派送中 3已签收 4异常
- shippedAt（DateTime）
- receivedAt（DateTime?）
- createdAt, updatedAt
- 索引：unique(orderId), index(trackingNo)

### LogisticsTrace（物流轨迹）
字段：
- id（Int, PK）
- shipmentId（Int）
- traceTime（DateTime）
- description（String）
- status（Int）
- createdAt
- 索引：index(shipmentId, traceTime)

## 接口

### 运费模板（商家）
GET /seller/freight-templates —— 列表
POST /seller/freight-templates —— 创建
PATCH /seller/freight-templates/:id —— 更新
DELETE /seller/freight-templates/:id —— 删除

### 发货（商家）
POST /seller/orders/:orderNo/ship —— 发货（入参：expressCode, expressCompany, trackingNo）
POST /seller/orders/batch-ship —— 批量发货（入参：数组）

### 物流查询（买家）
GET /shipments/:orderNo —— 查询订单物流详情（含轨迹）

### 运费试算（内部）
在订单预览里已计算运费，本期运费模板只做 CRUD

## 业务规则

### 运费模板
- 计费公式：首件 firstFee + 超出部分 ceil((count - firstCount) / extraCount) * extraFee
- 包邮地区：属于 freeRegions 的省份，运费 0
- 不发货地区：属于 excludedRegions 的省份，下单时校验并抛错

### 发货
- 仅订单状态为 PAID（1）可发货
- 事务内：
  1. 校验订单属于当前用户（商家）且状态为 1
  2. 创建 Shipment 记录（status=1 运输中）
  3. 更新 Order：status=SHIPPED（2）, shippedAt=now
- 一个订单只能发一次货（unique(orderId) 约束）

### 批量发货
- 入参：数组，每项 { orderNo, expressCode, expressCompany, trackingNo }
- 循环调用单个发货逻辑，失败的收集错误
- 返回：{ success: N, failed: [{ orderNo, reason }] }

### 物流轨迹
- 一期用 mock：发货时自动插入 2 条假轨迹（已揽收、运输中）
- GET /shipments/:orderNo 返回 Shipment + LogisticsTrace 数组
- 只允许订单所属用户或商家查看

### 确认收货
- POST /orders/:orderNo/confirm —— 已存在（P4 已实现，P6 不动）
- 但要更新 Shipment：status=3, receivedAt=now

## 参考模板
- Controller: apps/api/src/modules/orders/orders.controller.ts
- Service: apps/api/src/modules/orders/orders.service.ts
- DTO: apps/api/src/modules/orders/dto/create-order.dto.ts
- 单测: apps/api/test/unit/order.service.spec.ts

## 单测要求
- freight.service：CRUD + 运费计算（首件、续件、包邮、不发货）
- shipment.service：发货（校验订单状态）+ 批量发货 + 查询物流

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 orders 模块结构