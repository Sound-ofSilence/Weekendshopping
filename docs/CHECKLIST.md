# 模块完成检查清单

## 编码
- [ ] 数据表迁移已应用
- [ ] 所有接口已实现
- [ ] DTO 有校验
- [ ] 单测覆盖核心逻辑

## 验证
- [ ] pnpm --filter @weekend-shopping/api build 通过
- [ ] pnpm --filter @weekend-shopping/api test:unit 全绿
- [ ] docker compose build api 成功
- [ ] docker compose up -d 后 4 个 healthy
- [ ] curl 验证核心接口

## 文档
- [ ] PROGRESS.md 更新
- [ ] DECISIONS.md 追加（如有决策）
- [ ] PITFALLS.md 追加（如踩新坑）

## 提交
- [ ] git add . && git commit -m "feat(PX): xxx"
- [ ] 关闭对话，开新对话做下一个
