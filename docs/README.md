# Shuangpin Practice 文档包

项目中文名：双拼练习  
项目英文名：Shuangpin Practice  
GitHub 仓库建议名称：`shuangpin-practice`

## 文件

1. `01-PRD.md`：产品需求、范围、页面结构、交互规则与验收标准。
2. `02-TECH-ARCHITECTURE.md`：技术架构、技术栈、目录、状态管理、组件规范与测试策略。
3. `03-IMPLEMENTATION-PLAN.md`：六阶段线性实现计划和每阶段验收条件。
4. `Shuangpin-Practice-Docs.docx`：三份文档的合并排版版本，适合阅读、评审或转发。

## 关键决策

- 新项目重新实现，不直接 Fork 旧项目作为底座。
- 产品主体为单主页面，打开即可练习。
- Next.js 静态导出，无后端、数据库和登录。
- Tailwind CSS + shadcn/ui，明确使用 Base UI。
- shadcn/ui 已有组件时必须优先使用，禁止在业务层重复造基础交互组件。
- Zustand 统一管理共享业务状态，并通过 persist 保存必要数据。
- 桌面端更多设置使用 Popover，移动端使用 Drawer。
- Vitest 测试领域逻辑和 Store，Playwright 只覆盖关键完整流程。
- MVP 支持四种双拼方案、三种练习模式、200 个单字和 50 个词组。
