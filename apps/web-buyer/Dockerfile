# ============ 依赖阶段 ============
FROM node:20-slim AS deps

WORKDIR /app

# 复制 workspace 清单
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-buyer/package.json ./apps/web-buyer/package.json
COPY apps/api/package.json ./apps/api/package.json

# 安装 pnpm
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 安装所有依赖
RUN pnpm install --frozen-lockfile

# ============ 构建阶段 ============
FROM node:20-slim AS builder

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# 从 deps 阶段拷贝 node_modules
COPY --from=deps /app/node_modules ./node_modules

# 拷贝源码
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web-buyer ./apps/web-buyer

# 构建（生产 API 地址走 Nginx 同源 /api）
ENV NEXT_PUBLIC_API_BASE=/api
ENV NEXT_TELEMETRY_DISABLED=1

WORKDIR /app/apps/web-buyer
RUN pnpm build

# ============ 运行阶段 ============
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 拷贝 standalone 产物
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-buyer/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-buyer/.next/static ./apps/web-buyer/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web-buyer/public ./apps/web-buyer/public

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web-buyer/server.js"]