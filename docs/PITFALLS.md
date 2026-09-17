# 已踩过的坑（禁止重复）

## 1. 相对导入路径
- src/modules/xxx/dto/ → src/common/：3 层 ../../../common/
- src/modules/xxx/ → src/common/：2 层 ../../common/
- src/auth/ → src/common/：1 层 ../common/

## 2. Prisma + Docker
- 基础镜像用 node:20-slim（不要 alpine）
- build 和 runner 阶段都要 apt-get install -y openssl
- 精确 COPY 源码子目录，不要 COPY 整目录

## 3. Prisma 金额字段
- 输出用 .toFixed(2)，不要用 .toString()

## 4. Prisma 类型
- include 不要用 as const，用 satisfies Prisma.XxxInclude

## 5. Cline 工作规则
- 不用终端读文件，用 read_files
- 不跑命令，用户手动跑
- 只输出 diff，不重印整个文件
- 一次对话只做一件事

## 6. Docker 日常运维
- 每天开机后必须 docker compose up -d
- 不要 docker compose down -v（会删数据）

## 7. PostgreSQL 全文搜索
- 用 pg_trgm 扩展 + GIN 索引，不要只用 ILIKE
- 迁移脚本写 CREATE EXTENSION IF NOT EXISTS pg_trgm;