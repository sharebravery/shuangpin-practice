# 双拼练习 · Shuangpin Practice

打开页面，选择双拼方案，马上开始练习。

A simple, modern Shuangpin (double-pinyin) practice tool — no signup, no backend, static export. Supports Xiaohe, Microsoft, Ziranma and Sogou schemes with a live key map.

🔗 **在线使用：<https://shuangpin.sharebravery.com>**

## 功能

- 四种方案：小鹤、微软、自然码、搜狗双拼
- 三种模式：键位练习、单字练习、词组练习（逐字输入）
- 实时键位图：随方案切换，高亮已输入与正确/错误键
- 错题机制：3–8 题后强制重现，错题优先 3 倍权重，错题专项
- 本地持久化：方案、模式、设置、累计统计刷新后保留
- 浅色 / 深色 / 跟随系统，桌面与移动端自适应
- 微软双拼 `üe` 标准键 `t`，兼容接受 `v`

## 技术栈

Next.js (App Router, 静态导出) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Zustand · next-themes · Vitest · Playwright

## 本地开发

```bash
pnpm install
pnpm dev
```

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 静态导出构建（产物在 `out/`） |
| `pnpm start` | 本地预览静态产物（`serve out`） |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint（含组件约束） |
| `pnpm test` | Vitest 单元测试 |
| `pnpm test:e2e` | 先 build 再运行 Playwright |

## 质量门槛

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm test:e2e
```

## 部署

纯静态导出（`out/`），可部署到 Vercel、Cloudflare Pages 等任意静态托管。

## License

[MIT](./LICENSE)
