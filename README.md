# 双拼练习 · Shuangpin Practice

打开页面，直接开始练习。无登录、无后端、无分组打断。

A simple, modern Shuangpin (double-pinyin) practice tool — static, local-first and ready to use.

🔗 **在线使用：<https://shuangpin.sharebravery.com>**

## 功能

- 四种方案：小鹤、微软、自然码、搜狗双拼
- 三种模式：键位、单字、词组（逐字输入）
- 连续练习：答对直接下一题，答错短暂停留后继续
- 实时键位图：支持谱面 / 键盘两种布局、输入轨迹与正确键呼吸提示
- 自动复习：错题按当前双拼方案独立记录，之后自然重现并提高出题权重
- 本地持久化：方案、模式、显示设置与累计统计保存在浏览器本地
- 三套主题：天青（汝瓷）、朱砂（印泥）、玄青（黑釉）；统一采用克制的东方材料语言
- 桌面、平板、手机可用；窄屏键位图保持可点击尺寸并横向滚动
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
| `pnpm test:e2e` | 构建后运行 Playwright |

## 质量门槛

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm exec playwright test
```

## 部署

项目使用纯静态导出（`out/`），当前正式地址为 `shuangpin.sharebravery.com`。

## 数据与隐私

无账号、无后端。练习设置、累计统计和错题记录只保存在当前浏览器本地，可在设置中随时清除。

## 作者

许多言

## License

[MIT](./LICENSE)
