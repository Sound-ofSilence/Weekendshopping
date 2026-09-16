# 项目卡片

项目名：Weekend Shopping
定位：多商家入驻型综合电商平台（类淘宝）

技术栈：
- 后端 NestJS + Prisma + PostgreSQL + Redis + ES + RabbitMQ
- 买家端 Next.js 14 + TailwindCSS + shadcn/ui
- 商家/平台端 React + Vite + Ant Design Pro
- Docker 化，Linux 部署

铁律：
1. 不改技术栈，不加需求外功能
2. 资金/库存必须事务 + 幂等
3. 金额用 decimal
4. 响应格式 { code, message, data, traceId }
5. 每个接口必须写单测

执行规则：
- 先输出文件计划，我确认后编码
- 一次只做一个模块
- 只输出变化/新增的文件
- 交付必须含单测
