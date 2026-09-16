FROM node:20-alpine AS build
ENV PNPM_HOME="/pnpm"
ENV PATH="$PNPM_HOME:$PATH"
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/package.json
COPY apps/api/prisma ./apps/api/prisma
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
RUN pnpm --filter @weekend-shopping/api prisma:generate
RUN pnpm --filter @weekend-shopping/api build
RUN pnpm --filter @weekend-shopping/api --prod deploy /prod/app
RUN cd /prod/app && ./node_modules/.bin/prisma generate

FROM node:20-alpine AS runner
ENV NODE_ENV=production
RUN addgroup -S nodejs && adduser -S nodejs -G nodejs
USER nodejs
WORKDIR /app
COPY --from=build --chown=nodejs:nodejs /prod/app ./
EXPOSE 4000
CMD ["node", "dist/main.js"]
