# P10 平台后台接口

## 已确定的决策（不要再问）
- 一期简化：不做真实 RBAC 权限分配，所有平台接口用 Role.ADMIN 校验
- 商品审核：一期 P2 已简化（提交即通过），P10 只提供"审核通过/驳回"接口备用
- 提现审核：运营审批后 status 变为 3（已打款），Mock 到账
- 结算单：平台手动生成，一期不跑定时任务

## 数据表（Prisma）

### AdminLog（操作日志）
字段：
- id (Int, PK)
- adminId (Int)
- module (String)
- action (String)
- targetId (Int?)
- detailJson (Json?)
- ip (String?)
- createdAt (DateTime)
- 索引：index(adminId, createdAt), index(module)

## 接口

### 数据看板
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/dashboard/stats | 全站核心指标（GMV/订单数/用户数/店铺数） |
| GET | /admin/dashboard/trend | 近 7 日 GMV/订单趋势 |
| GET | /admin/dashboard/top-shops | 店铺销售 TOP 10 |
| GET | /admin/dashboard/top-categories | 类目销售分布 |

### 商家管理
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/shops | 店铺列表（分页） |
| POST | /admin/shops/:shopId/freeze | 冻结店铺 |
| POST | /admin/shops/:shopId/unfreeze | 解冻店铺 |

### 商品管理
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/products | 全站商品列表 |
| POST | /admin/products/:spuId/off-sale | 强制下架 |
| POST | /admin/products/:spuId/approve | 审核通过 |
| POST | /admin/products/:spuId/reject | 审核驳回 |

### 售后仲裁
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/after-sales | 全站售后列表 |
| POST | /admin/after-sales/:afterSaleNo/intervene | 平台介入裁决 |

### 用户管理
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/users | 用户列表 |
| POST | /admin/users/:userId/ban | 封禁 |
| POST | /admin/users/:userId/unban | 解封 |

### 财务管理
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/withdrawals | 提现审核列表（status=0） |
| POST | /admin/withdrawals/:withdrawalNo/approve | 批准提现 |
| POST | /admin/withdrawals/:withdrawalNo/reject | 拒绝提现 |

### 系统
| 方法 | 路径 | 说明 |
|---|---|---|
| GET | /admin/logs | 操作日志列表 |

## 业务规则

### 数据看板
- GMV：全站 status>=1 订单的 payAmount 总和
- 用户数：User 表 count
- 店铺数：Shop 表 count（一期 shopId 固定为 1，但接口要通用）
- 趋势：按日聚合近 7 天

### 商家管理
- 冻结店铺：shop.status=0（不影响已有订单，新订单拒绝）
- 一期不做审核流程（P2 已简化）

### 商品管理
- 强制下架：spu.status=3
- 审核通过：spu.auditStatus=1
- 审核驳回：spu.auditStatus=2

### 售后仲裁
- 平台介入：afterSale.status=8（已进入仲裁）
- 一期不做真实裁决流程，只记录

### 用户管理
- 封禁：user.status=0（禁止登录）
- 解封：user.status=1

### 财务管理
- 批准提现：withdrawal.status=3 + shopWallet.frozenBalance -= amount + shopWallet.totalWithdrawn += amount
- 拒绝提现：withdrawal.status=2 + shopWallet.frozenBalance -= amount + shopWallet.balance += amount（退回）

### 操作日志
- 关键操作（冻结/封禁/审核/提现批准）要写 AdminLog
- 用 @CurrentUser() 取 adminId

## 参考模板
- Controller: apps/api/src/modules/seller/seller-dashboard.controller.ts
- Service: apps/api/src/modules/seller/dashboard.service.ts
- DTO: apps/api/src/modules/seller/dto/create-withdrawal.dto.ts
- 单测: apps/api/test/unit/order.service.spec.ts

## 输出要求
- 先输出文件清单，用户确认后编码
- 严禁跑命令
- 只输出 diff
- 参考 seller 模块结构