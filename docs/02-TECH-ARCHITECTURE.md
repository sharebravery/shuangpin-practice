# 双拼练习技术架构与技术栈文档

版本：v1.1  
项目名称：双拼练习（Shuangpin Practice）  
架构类型：静态站点、客户端练习引擎、无后端  
核心原则：简单、线性、组件优先、状态集中、规则与界面分离。

## 1. 最终技术选型

项目采用：

- Next.js App Router。
- React。
- TypeScript 严格模式。
- Tailwind CSS。
- shadcn/ui。
- Base UI primitives。
- Zustand。
- next-themes。
- Lucide Icons。
- Vitest。
- Playwright。
- pnpm。

第一版不使用：

- Supabase。
- Hono。
- PostgreSQL。
- Redis。
- Server Actions。
- 动态 API Route。
- 用户认证。
- Redux。
- React Context 管理业务状态。
- React Testing Library。
- 复杂状态切片架构。
- 服务端数据库。

## 2. 选型说明

### 2.1 Next.js

虽然 MVP 只有一个主页面，但 Next.js 可以：

- 输出静态 HTML、CSS 和 JavaScript。
- 提供 Metadata、robots、sitemap 等内置能力。
- 保留后续增加独立搜索页面的可能。
- 不要求项目一开始就运行服务端。

项目使用 `output: "export"`，构建后可以部署到任意支持静态文件的平台。

```ts
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  output: "export",
}

export default nextConfig
```

第一版不使用静态导出不支持的服务端功能。

### 2.2 shadcn/ui 与 Base UI

shadcn/ui 用于提供统一、可访问、可维护的基础交互组件。

项目明确选择 Base UI 作为底层 primitives。初始化时显式指定，避免环境默认值变化：

```bash
pnpm dlx shadcn@latest init -d --base base-ui
```

### 2.3 Zustand

Zustand 管理跨组件共享的客户端状态。

使用场景：

- 当前双拼方案。
- 当前练习模式。
- 当前题目。
- 当前输入。
- 练习进度。
- 正确率。
- 连续正确。
- 错题。
- 用户设置。

通过 `persist` 中间件保存必要状态。

### 2.4 next-themes

next-themes 只负责：

- 浅色主题。
- 深色主题。
- 跟随系统。
- 保存用户主题偏好。

主题不进入 Zustand，避免同一状态由两个系统管理。

### 2.5 Lucide Icons

Lucide 用于：

- 设置图标。
- 主题图标。
- 键盘图标。
- 展开和收起图标。
- 正确、错误、暂停和重新开始图标。

不自行绘制重复 SVG，也不混用多套图标库。

### 2.6 Vitest

Vitest 用于测试：

- 双拼编码。
- 方案映射。
- 出题逻辑。
- 答案验证。
- Zustand Actions。
- 错题权重。
- 持久化迁移。

### 2.7 Playwright

Playwright 用于测试真实浏览器中的完整用户流程。

第一版只保留三至四条关键流程，不追求大量界面测试。

## 3. 总体架构

```text
静态页面
├── 页面结构与 SEO
├── 主练习工作区
├── 页面说明
└── 云北入口

客户端状态
└── Zustand Store
    ├── 设置
    ├── 当前练习会话
    ├── 统计
    └── 错题

纯业务逻辑
├── 拼音标准化
├── 双拼编码
├── 答案校验
├── 出题
└── 统计计算

静态数据
├── 双拼方案
├── 常用单字
└── 常用词组
```

项目没有：

- 网络业务接口。
- 数据库。
- 服务端业务。
- 登录态。
- 后台任务。

## 4. 目录结构

```text
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── icon.svg
│   ├── manifest.ts
│   ├── robots.ts
│   └── sitemap.ts
├── components/
│   ├── ui/
│   │   └── shadcn/ui 生成组件
│   ├── site-header.tsx
│   ├── site-footer.tsx
│   └── theme-toggle.tsx
├── features/
│   └── practice/
│       ├── practice-workspace.tsx
│       ├── practice-toolbar.tsx
│       ├── practice-prompt.tsx
│       ├── practice-input.tsx
│       ├── practice-stats.tsx
│       ├── keyboard-map.tsx
│       ├── more-settings.tsx
│       └── result-dialog.tsx
├── stores/
│   └── practice-store.ts
├── lib/
│   └── shuangpin/
│       ├── types.ts
│       ├── normalize-pinyin.ts
│       ├── encode.ts
│       ├── validate.ts
│       ├── generate-question.ts
│       └── statistics.ts
├── data/
│   ├── schemes.ts
│   ├── characters.ts
│   └── phrases.ts
└── tests/
    ├── unit/
    └── e2e/
```

不再建立：

- 单独的 domain 目录。
- 单独的 hooks 层。
- 单独的 storage 层。
- 大量空的 index 文件。
- 为每个小功能建立独立 Store。

## 5. 客户端与服务端边界

`app/page.tsx` 保持为 Server Component，负责：

- 页面结构。
- 静态说明内容。
- Metadata。
- 渲染 PracticeWorkspace。

`PracticeWorkspace` 是 Client Component，负责：

- Zustand 状态。
- 用户输入。
- 键位图高亮。
- 设置浮层。
- 结果弹窗。

不要在根布局或整个页面无差别添加 `"use client"`。

## 6. 双拼数据模型

### 6.1 双拼方案

```ts
export interface ShuangpinScheme {
  id: "xiaohe" | "microsoft" | "ziranma" | "sogou"
  name: string
  initials: Record<string, string>
  finals: Record<string, string>
  zeroInitials: Record<string, string>
}
```

### 6.2 单字题目

```ts
export interface CharacterQuestion {
  id: string
  character: string
  pinyin: string
  weight?: number
}
```

### 6.3 词组题目

```ts
export interface PhraseQuestion {
  id: string
  text: string
  syllables: string[]
  weight?: number
}
```

### 6.4 练习模式

```ts
export type PracticeMode = "mapping" | "character" | "phrase"
```

## 7. 纯业务逻辑

以下逻辑必须写成纯函数，不依赖 React、Zustand、DOM 或 shadcn/ui：

```ts
normalizePinyin(pinyin)
splitSyllable(pinyin)
encodeSyllable(pinyin, scheme)
validateAnswer(input, expected)
generateQuestion(options)
calculateAccuracy(correct, completed)
selectWeightedQuestion(pool, mistakes, random)
```

要求：

- 相同输入得到相同结果。
- 无法编码时明确返回错误。
- 出题函数允许注入随机函数。
- 方案数据错误在测试阶段被发现。
- UI 不自行计算双拼编码。
- Store 不复制编码算法。

## 8. Zustand Store

第一版只建立一个 Store：

```ts
interface PracticeStore {
  settings: PracticeSettings
  session: PracticeSession
  mistakes: Record<string, MistakeRecord>
  totals: PracticeTotals
  hasHydrated: boolean

  setScheme: (schemeId: SchemeId) => void
  setMode: (mode: PracticeMode) => void
  updateSettings: (settings: Partial<PracticeSettings>) => void
  startSession: () => void
  submitInput: (input: string) => SubmissionResult
  nextQuestion: () => void
  pause: () => void
  resume: () => void
  resetSession: () => void
  clearHistory: () => void
}
```

### 8.1 Store 管理的状态

Store 管理：

- 方案。
- 模式。
- 用户设置。
- 当前练习会话。
- 错题。
- 累计统计。

### 8.2 不放入 Store 的状态

以下状态使用组件内部 `useState`：

- Popover 是否打开。
- Drawer 是否打开。
- Dialog 是否打开。
- Tooltip 状态。
- 临时悬停状态。

### 8.3 持久化字段

使用 Zustand `persist` 的 `partialize` 只保存：

```ts
{
  settings,
  mistakes,
  totals,
}
```

不保存：

- 当前输入。
- 当前题目。
- 当前练习状态。
- 暂停状态。
- 弹窗状态。
- 临时错误提示。

### 8.4 Hydration 处理

Zustand 从 localStorage 恢复数据时，可能与构建时的默认 HTML 不一致。

处理方式：

- Store 增加 `hasHydrated`。
- 持久化恢复完成后设为 `true`。
- 恢复前先使用默认设置。
- 不让页面整体空白等待。
- 只在主题切换和持久化设置控件上处理必要的挂载差异。

## 9. 题库策略

第一版题库规模统一为：

- 200 个常用单字。
- 50 个常用词组。

每条题目必须：

- 有稳定 ID。
- 有明确拼音。
- 可以被四种方案编码。
- 不依赖运行时拼音 API。
- 不包含需要猜测读音的孤立多音字。

题库直接进入项目源码，不从远程接口加载。

第一版达到目标数量后停止扩充，避免题库整理阻塞发布。

## 10. 设置设计

没有独立设置页面。

### 10.1 主页面直接展示

- 双拼方案 Select。
- 练习模式 Select。
- 显示或隐藏键位图。
- 更多设置。
- 主题切换。

### 10.2 更多设置

桌面端使用 Popover。

移动端使用 Drawer。

内容：

- 显示拼音：Switch。
- 错题优先：Switch。
- 自动下一题：Switch。
- 音效：Switch。
- 每组题数：Select。
- 清空记录：Button + Alert Dialog。

不使用大型设置中心，也不建立复杂分类。

## 11. shadcn/ui 强制规范

### 11.1 第一版需要的组件

只安装实际使用的组件：

```text
button
select
switch
popover
drawer
dialog
alert-dialog
tooltip
accordion
progress
separator
input
badge
sonner
```

不执行 `add --all`。

### 11.2 使用映射

| 功能 | 组件 |
|---|---|
| 普通操作 | Button |
| 方案和模式 | Select |
| 设置开关 | Switch |
| 桌面设置 | Popover |
| 移动端设置 | Drawer |
| 结果 | Dialog |
| 清空确认 | Alert Dialog |
| 输入 | Input |
| 辅助提示 | Tooltip |
| 状态 | Badge |
| 进度 | Progress |
| 页面说明 | Accordion |
| 消息提示 | Sonner |

### 11.3 禁止事项

业务代码不得直接使用：

```tsx
<button />
<select />
<dialog />
```

不得：

- 使用 `div + onClick` 模拟按钮。
- 自行实现 Modal。
- 自行实现 Switch。
- 自行实现 Dropdown。
- 在多个目录中复制 Button 或 Select。
- 使用 Tailwind 重造已有 shadcn/ui 组件。

原生语义元素可以用于结构和布局，但不得承担已有组件的交互职责。

### 11.4 AI 开发约束

开发一个交互功能前必须：

1. 查询 shadcn/ui 是否已有组件。
2. 使用 CLI 添加组件。
3. 阅读组件文档。
4. 组合业务界面。
5. 只有没有合适组件时才自行实现。

AI 不能以“功能简单”为由跳过组件库。

## 12. Tailwind CSS 规范

要求：

- 使用 CSS Variables 和设计 Token。
- 使用统一圆角。
- 使用统一间距。
- 使用 `cn()` 合并条件类名。
- 组件变体优先使用现有 variant。
- 响应式设计使用统一断点。
- 页面布局使用语义元素和 Tailwind。

禁止：

- 大量任意十六进制颜色。
- 大量 arbitrary values。
- 复制超长 className。
- 在业务组件中大量使用内联样式。
- 每个组件创建自己的视觉规范。

## 13. 主题管理

主题只由 next-themes 管理：

- `light`
- `dark`
- `system`

要求：

- `<html>` 添加 `suppressHydrationWarning`。
- ThemeProvider 使用 `attribute="class"`。
- ThemeToggle 挂载完成后再显示当前主题图标。
- Zustand 不重复保存主题。

## 14. 测试策略

### 14.1 Vitest

测试：

- 四种方案的编码。
- 零声母。
- 特殊韵母。
- 无效拼音。
- 答案校验。
- 出题去重。
- 错题权重。
- 正确率。
- Store Actions。
- 持久化字段筛选。
- 数据迁移。

### 14.2 Playwright

只保留关键流程：

1. 打开首页并完成一道单字题。
2. 切换方案后使用新的编码规则。
3. 修改设置、刷新页面并确认设置保留。
4. 使用移动端视口打开更多设置并完成一道题。

Playwright 测试按照用户看到和操作的界面编写，不依赖内部实现细节。

## 15. 性能和可访问性

要求：

- 首屏不请求远程题库。
- 不引入图表库。
- 不加载大型图片。
- 键位图使用 HTML 和 CSS。
- 图标按需导入。
- 输入框具备明确 Label。
- 所有按钮支持键盘操作。
- 焦点状态清晰可见。
- 动画尊重 `prefers-reduced-motion`。
- 图标按钮提供可访问名称。
- 颜色不是唯一的正确或错误提示。

不把“完全离线运行”作为 MVP 验收条件，因为可靠离线能力需要额外的 Service Worker 或 PWA 设计。

## 16. SEO

首页配置：

- Title。
- Description。
- Canonical。
- Open Graph。
- 社交分享信息。
- icon。
- manifest。
- robots。
- sitemap。

页面正文自然覆盖：

- 双拼练习。
- 小鹤双拼。
- 微软双拼。
- 自然码双拼。
- 搜狗双拼。
- 双拼键位图。

MVP 不建立大量独立 SEO 页面。

## 17. 部署

第一版首选部署到 Vercel。

要求：

- 使用纯静态导出。
- 不使用平台专有函数。
- 保持可迁移到 Cloudflare Pages 或其他静态托管。
- 自定义域名独立于托管平台管理。

## 18. 质量门槛

每次准备发布前必须执行：

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:e2e
```

所有命令通过后才算完成。

同时人工检查：

- 是否错误绕过 shadcn/ui。
- 是否引入不必要依赖。
- 是否出现重复状态来源。
- 是否影响移动端输入。
- 是否将非必要功能加入 MVP。
