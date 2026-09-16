# Weekend Shopping 开发环境

多商家入驻型综合电商平台（类淘宝）的 Docker 开发环境骨架。

本仓库当前通过 Docker Compose 一键启动基础设施服务：PostgreSQL、Redis、RabbitMQ、Elasticsearch。

## 前置要求

- 已安装 Docker 与 Docker Compose（Docker Desktop 自带 Compose）
- 本机以下端口空闲：`5432`、`6379`、`5672`、`15672`、`9200`

## 快速启动

1. 复制环境变量模板：

   ```bash
   cp .env.example .env
   ```

   Windows PowerShell 可执行：

   ```powershell
   Copy-Item .env.example .env
   ```

2. 后台启动所有服务：

   ```bash
   docker compose up -d
   ```

3. 查看服务状态与健康检查：

   ```bash
   docker compose ps
   ```

## 服务一览

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | localhost:5432 | 关系数据库 |
| Redis | localhost:6379 | 缓存 |
| RabbitMQ | localhost:5672 / localhost:15672 | 消息队列（AMQP / 管理台） |
| Elasticsearch | localhost:9200 | 搜索引擎（已关闭安全认证，单节点） |

RabbitMQ 管理台：http://localhost:15672 （账号密码见 `.env` 中 `RABBITMQ_DEFAULT_USER` / `RABBITMQ_DEFAULT_PASS`）

## 常用命令

```bash
# 启动（后台）
docker compose up -d

# 前台启动（实时查看日志）
docker compose up

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f             # 所有服务
docker compose logs -f postgres    # 单个服务

# 停止（保留数据卷）
docker compose down

# 停止并删除数据卷（清空数据，谨慎使用）
docker compose down -v

# 重启单个服务
docker compose restart redis

# 进入容器
docker compose exec postgres psql -U taobao -d taobao
docker compose exec redis redis-cli
```

## 数据持久化

- PostgreSQL 数据：命名卷 `postgres_data`
- Redis 数据：命名卷 `redis_data`

删除数据卷（`docker compose down -v`）后数据将不可恢复，请谨慎操作。
