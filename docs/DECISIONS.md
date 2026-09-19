# 决策记录

（每次做技术决定后追加）
## D004 Docker + Prisma 环境配置（踩坑记录）
日期：2026-09-17

踩坑：
1. pnpm workspace 的 symlink 在 Docker 里会失效，不能 COPY 整目录覆盖
2. Alpine 镜像没 openssl，Prisma 无法加载引擎
3. Debian slim 镜像需要手动 apt install openssl

最终方案：
- 基础镜像 node:20-slim
- build 和 runner 阶段都 apt-get install -y openssl
- 精确 COPY 源码目录，不覆盖 node_modules
- 整个构建产物 COPY 到 runner，不用 --prod deploy

影响：后续所有 Node 服务 Dockerfile 都用这个模板

## D005 满减一期不接入下单
日期：2026-09-19
原因：P8b 只做满减配置 + computeBestReduction 计算函数，不改 P4 订单创建
影响：前端下单时暂时不享受满减优惠
后续：P12 优化阶段把 computeBestReduction 接入 OrdersService 价格计算