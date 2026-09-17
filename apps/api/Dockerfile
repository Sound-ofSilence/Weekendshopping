# ============ 构建阶段 ============
FROM node:20-slim AS build

# 装 openssl（让 Prisma 能检测到正确的 libssl 版本）
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

WORKDIR /app

# 1. 复制 workspace 清单，安装依赖
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
RUN pnpm install --frozen-lockfile

# 2. 复制源码
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/

# 3. 生成 Prisma Client（现在 openssl 已就位，会生成 openssl-3.0.x 引擎）
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder?schema=public"
RUN pnpm --filter @weekend-shopping/api exec prisma generate

# 4. 编译
RUN pnpm --filter @weekend-shopping/api build

# ============ 运行阶段 ============
FROM node:20-slim AS runner

# 装 openssl（运行时加载 Prisma 引擎需要 libssl3）
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app
USER node

# 整个构建产物直接复制
COPY --from=build --chown=node:node /app ./

EXPOSE 4000

CMD ["node", "apps/api/dist/main.js"]