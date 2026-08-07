# 第三方来源说明

本项目使用以下开源依赖及其许可证。题库与双拼方案规则为重新整理编写，未复制第三方业务源码。

## 运行时依赖

| 依赖 | 用途 | 许可证 |
| --- | --- | --- |
| next | 应用框架（静态导出） | MIT |
| react / react-dom | UI 运行时 | MIT |
| @base-ui/react | shadcn/ui 底层 primitives | MIT |
| class-variance-authority | 组件变体 | Apache-2.0 |
| clsx | 类名拼接 | MIT |
| tailwind-merge | Tailwind 类名合并 | MIT |
| lucide-react | 图标 | ISC |
| next-themes | 主题切换 | MIT |
| zustand | 状态管理 | MIT |
| sonner | 消息提示 | MIT |
| tw-animate-css | 动画工具样式 | MIT |

## 开发依赖

| 依赖 | 用途 | 许可证 |
| --- | --- | --- |
| tailwindcss / @tailwindcss/postcss | 原子化 CSS | MIT |
| typescript / @types/* | 类型 | Apache-2.0 / MIT |
| eslint / eslint-config-next | Lint 与组件约束 | MIT |
| vitest / @vitejs/plugin-react / jsdom | 单元测试 | MIT |
| @playwright/test | E2E 测试 | Apache-2.0 |
| serve | 静态产物本地服务 | MIT |
| shadcn | 组件 CLI | MIT |

## 题库与方案

- 单字与词组题库为常用汉字 / 词组的重新整理，配置明确读音，不依赖运行时拼音 API。
- 四种双拼方案（小鹤、微软、自然码、搜狗）的键位映射依据各方案公开规则整理，附单元测试验证。
