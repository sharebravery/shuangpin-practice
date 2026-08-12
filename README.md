# 珠落 · Shuangpin Practice

珠落是一款专注双拼练习与键位记忆的在线工具。支持小鹤双拼、微软双拼、自然码、搜狗双拼，提供键位、单字、词组练习、错题复习和输入轨迹。

一音两键，珠落成字。

Zhuluo is a simple, modern Shuangpin Practice tool.

🔗 **在线使用：<https://shuangpin.sharebravery.com>**  
🏠 **许多言主页：<https://sharebravery.com>**

## 功能

- 四种方案：小鹤、微软、自然码、搜狗双拼
- 三种模式：键位、单字、词组（逐字输入）
- 连续练习：答对直接下一题；答错后停在当前题，打对后才继续
- 实时键位图：支持谱面 / 键盘两种布局、输入轨迹与正确键呼吸提示
- 自动复习：错题按当前双拼方案独立记录，之后自然重现并提高出题权重
- 练习记录：方案、模式、显示设置与累计统计保存在当前浏览器
- 三套主题：天青（汝瓷）、朱砂（印泥）、玄青（黑釉）；统一采用克制的东方材料语言
- 桌面、平板、手机可用；窄屏键位图保持可点击尺寸并横向滚动
- 微软双拼 `üe` 标准键 `t`，兼容接受 `v`
- `j/q/x/y` 后拼音中的 `u` 表示 `ü`。练习仍显示标准双拼码，同时兼容 `ju/qu/xu/yu` 这类主流输入法常见的两键输入习惯；不启用完整全拼混输。

## 技术栈

Next.js App Router · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Base UI) · Zustand · next-themes · Vitest · Playwright

## 本地开发

```bash
pnpm install
pnpm dev
```

## 脚本

| 命令 | 说明 |
| --- | --- |
| `pnpm dev` | 本地开发 |
| `pnpm build` | 生产构建 |
| `pnpm start` | 本地预览构建产物 |
| `pnpm typecheck` | TypeScript 类型检查 |
| `pnpm lint` | ESLint（含组件约束） |
| `pnpm test` | Vitest 单元测试 |
| `pnpm test:e2e` | 构建后运行 Playwright |

## 质量门槛

```bash
pnpm typecheck && pnpm lint && pnpm test && pnpm build && pnpm exec playwright test
```

## 部署

当前正式地址为 <https://shuangpin.sharebravery.com>，作者与其他项目主页为 <https://sharebravery.com>。

## 关于珠落

珠落希望把双拼练习做得简单、直接：打开页面即可开始，不需要额外设置。项目源码已开源，欢迎反馈与改进。

## 作者

[许多言](https://sharebravery.com)

## License

[MIT](./LICENSE)
