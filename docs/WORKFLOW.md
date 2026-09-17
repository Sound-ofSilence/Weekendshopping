# 模块工作流

## 开新对话的标准开场（3 行）
按 docs/specs/PX-xxx.md 实现 PX 模块。
先读 docs/INDEX.md、docs/PITFALLS.md、docs/TEMPLATES.md。
然后输出文件清单，我确认后编码。

## 流程
1. 开新对话，发开场
2. Cline 输出清单 → 用户回「开始编码」
3. Cline 编码完 → 用户手动跑 build + test:unit
4. 报错 → 一次性贴全 → Cline 一次修完
5. 通过 → docker compose build api + up -d
6. git commit
7. 更新 PROGRESS.md
8. 关闭对话，开新对话做下一个

## 禁止
- Cline 跑命令
- 一次做多个模块
- 报错分多次贴
- 重印整个文件
