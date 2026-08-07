# 双拼练习 · Shuangpin Practice

打开页面，选择自己的双拼方案，马上开始练习。

一个无后端、无登录、静态导出的双拼练习工具，支持小鹤、微软、自然码、搜狗四种双拼方案，提供键位、单字和词组三种练习模式。

> 设计与实现细节见 [`docs/`](./docs) 目录下的 PRD、技术架构与实现计划。

## 技术栈

- Next.js（App Router，静态导出 `output: "export"`）
- React 19 + TypeScript（严格模式）
- Tailwind CSS v4 + shadcn/ui（Base UI primitives）
- Zustand（共享业务状态，persist 持久化）
- next-themes（浅色 / 深色 / 跟随系统）
- Lucide Icons
- Vitest（领域逻辑与 Store 单元测试）
- Playwright（关键用户流程 E2E）
- pnpm

## 常用脚本

```bash
pnpm install          # 安装依赖
pnpm dev              # 本地开发
pnpm build            # 静态导出构建（产物在 out/）
pnpm typecheck        # TypeScript 类型检查
pnpm lint             # ESLint（含组件约束规则）
pnpm test             # Vitest 单元测试
pnpm test:watch       # Vitest 监听模式
pnpm test:e2e         # 先 build 再运行 Playwright（需先安装浏览器：pnpm exec playwright install）
```

## 质量门槛

发布前必须全部通过：

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```

## 目录结构

```text
src/
├── app/                 # 路由、布局、全局样式、SEO 文件
├── components/          # 通用组件（site-header、theme-toggle 等）
│   └── ui/              # shadcn/ui 生成的基础组件（Base UI）
├── features/practice/   # 练习功能组件
├── stores/              # Zustand Store
├── lib/shuangpin/       # 纯业务逻辑（拼音标准化、编码、出题、校验）
├── data/                # 双拼方案、单字、词组题库
└── tests/
    ├── unit/            # Vitest 单元测试
    └── e2e/             # Playwright E2E
```

## 组件约束

业务代码禁止使用原生 `<button>`、`<select>`、`<dialog>`，禁止 `div/span + onClick` 模拟控件，必须使用 `src/components/ui/` 中的 shadcn/ui 组件。该规则由 ESLint `no-restricted-syntax` 强制，`src/components/ui/**` 豁免。

## 部署

首选 Vercel，使用纯静态导出产物（`out/`），可迁移到任意静态托管。
