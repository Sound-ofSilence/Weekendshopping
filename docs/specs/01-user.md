# P1 用户模块

## 数据库（Prisma）

### User
- id (Int, PK, autoincrement)
- phone (String, unique)
- email (String?, nullable)
- passwordHash (String)
- nickname (String?)
- avatar (String?)
- gender (Int?, 0未知/1男/2女)
- birthday (DateTime?, nullable)
- status (Int, 1正常/0禁用)
- createdAt, updatedAt, deletedAt

### UserRole
- id (Int, PK)
- userId (Int, FK)
- roleCode (String, 如 BUYER/SELLER/ADMIN)
- scopeId (Int?, 店铺ID或null)
- createdAt
- @@unique([userId, roleCode, scopeId])

### UserAddress
- id (Int, PK)
- userId (Int, FK)
- receiver (String)
- phone (String)
- province (String)
- city (String)
- district (String)
- detail (String)
- isDefault (Boolean, default false)
- tag (String?, 家/公司/学校)
- createdAt, updatedAt, deletedAt
- @@index([userId])

### UserRealname
- id (Int, PK)
- userId (Int, FK, unique)
- realName (String)
- idCardEnc (String, AES 加密)
- status (Int, 0待审/1通过/2拒绝)
- verifiedAt (DateTime?)
- createdAt

## 接口

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | /auth/send-sms | 发送验证码 |
| POST | /auth/register | 手机号+验证码注册 |
| POST | /auth/login | 密码/验证码登录 |
| POST | /auth/refresh | 刷新 token |
| POST | /auth/logout | 登出 |
| GET | /users/me | 获取当前用户 |
| PATCH | /users/me | 更新资料 |
| GET | /addresses | 地址列表 |
| POST | /addresses | 新增地址 |
| PATCH | /addresses/:id | 更新地址 |
| DELETE | /addresses/:id | 删除地址 |
| PATCH | /addresses/:id/default | 设为默认 |

## 业务规则

- 密码 8-20 位含字母数字，bcrypt hash（cost 10）
- 验证码 60s 内不可重发，同 IP 每小时 ≤10 次（先用内存模拟，接口预留 Redis）
- 登录连续失败 5 次锁定 15 分钟（先用内存模拟）
- 地址最多 20 条
- 默认地址唯一（设为默认时自动取消其他）
- 身份证号 AES 加密存储
- 密码字段响应里永远不返回
- JWT：accessToken（7天）+ refreshToken（30天），secret 从 .env 读

## 单测

- auth.service：注册（含重复手机号）、登录（含密码错误、锁定）、刷新
- address.service：CRUD + 默认地址唯一性

## 输出要求

- 先输出文件清单和每个文件职责
- 等用户确认后再编码
- 严禁跑命令，用户会手动验证