# 约定

## 代码
- TypeScript strict，禁止 any
- 提交格式：feat(PX): xxx / fix(PX): xxx
- 后端目录：apps/api/src/modules/<模块>/{controller,service,dto,entities}
- 前端页面：apps/web-buyer/app/<路由>/page.tsx

## 编码前自查
- [ ] 技术栈与 CARD.md 一致
- [ ] 无需求外功能
- [ ] 写了单测
- [ ] 金额 decimal
- [ ] 资金/库存有事务
- [ ] 无硬编码密钥
- [ ] 边界已处理

## Docker
- 每个服务有多阶段构建 Dockerfile
- 用 docker compose 编排
- 环境变量从 .env 读
