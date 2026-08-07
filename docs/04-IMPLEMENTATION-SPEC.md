# Shuangpin Practice 实现细则

版本：v1.0  
对应项目：Shuangpin Practice / 双拼练习  
文件建议位置：`docs/04-IMPLEMENTATION-SPEC.md`  
优先级：本文件高于外部参考项目，低于 PRD 中明确的产品范围

---

## 1. 文档目的

本文件用于消除执行 AI 在以下方面的自由发挥：

- 四种双拼方案的键位映射
- 拼音标准化与答案编码
- 练习状态转换
- 单字、词组与键位模式的具体交互
- 页面布局与键位图结构
- Zustand 状态边界
- 固定测试样例
- 关键验收场景

项目为**独立实现**：

- 不 Fork 任何现有双拼项目
- 不复制外部项目源码、组件结构或页面样式
- 不以参考项目为理由增加需求
- 外部项目只用于核对公开双拼规则和边界情况
- 外部实现与本文档冲突时，一律以本文档为准

---

## 2. MVP 实现边界

必须实现：

1. 单主页面
2. 小鹤、微软、自然码、搜狗四种方案
3. 键位、单字、词组三种练习模式
4. 正确与错误反馈
5. 错误编码拆解
6. 可交互键位图
7. Zustand 状态与本地持久化
8. 桌面 Popover 与移动 Drawer 设置
9. Vitest 核心规则测试
10. Playwright 四条主流程

不得增加：

- 登录
- 后端
- 数据库
- 排行榜
- AI 教练
- 完整课程
- 自定义方案编辑器
- 自定义文章输入
- PWA
- 独立设置页
- 侧边导航
- Dashboard
- 首屏 Hero 宣传区

---

## 3. 页面线框

桌面端目标结构：

```text
┌──────────────────────────────────────────────────────────────┐
│ 双拼练习                                      云北  主题  GitHub │
├──────────────────────────────────────────────────────────────┤
│ [小鹤双拼 ▼]  [单字练习 ▼]  [隐藏键位图]  [更多设置]          │
│                                                              │
│                            双                                │
│                         shuāng                               │
│                                                              │
│                    [ 请输入双拼编码 ]                         │
│                                                              │
│              正确率 95%    进度 8/20    连击 6               │
│                                                              │
│                    QWERTY 双拼键位图                          │
│                                                              │
├──────────────────────────────────────────────────────────────┤
│ 什么是双拼 / 使用方法 / 常见问题 / 关于项目                  │
└──────────────────────────────────────────────────────────────┘
```

移动端目标结构：

```text
┌──────────────────────────────┐
│ 双拼练习        主题  设置    │
├──────────────────────────────┤
│ [小鹤双拼 ▼] [单字练习 ▼]    │
│                              │
│              双              │
│           shuāng             │
│                              │
│       [ 请输入双拼编码 ]      │
│                              │
│ 正确率 95%  8/20  连击 6     │
│                              │
│ ← 可横向滚动的键位图 →        │
├──────────────────────────────┤
│ 折叠说明内容                  │
└──────────────────────────────┘
```

布局约束：

- 当前题目必须是页面视觉中心
- 不允许把练习区域拆成多列 Dashboard
- 不允许使用左侧栏
- 不允许堆叠多层 Card
- 首屏不得先展示介绍文字
- 手机软键盘弹出后，题目和输入框仍应可见
- 页面最大内容宽度建议为 `960px–1120px`
- 主练习区不强制使用 Card；优先使用留白和轻边界

---

## 4. shadcn/ui 使用约束

必须优先使用：

| 交互 | 组件 |
|---|---|
| 普通按钮 | `Button` |
| 方案选择 | `Select` |
| 模式选择 | `Select` |
| 设置开关 | `Switch` |
| 桌面更多设置 | `Popover` |
| 移动端更多设置 | `Drawer` |
| 练习结果 | `Dialog` |
| 清空确认 | `AlertDialog` |
| 输入框 | `Input` |
| 进度 | `Progress` |
| 辅助说明 | `Tooltip` |
| 页面说明 | `Accordion` |
| 消息反馈 | `Sonner` |
| 状态文本 | `Badge` |

业务代码禁止：

```tsx
<button />
<select />
<dialog />
<div onClick={...} />
```

键位图是业务专用组件，可以自行实现；键位图上的操作按钮仍必须使用 shadcn/ui。

---

## 5. 拼音内部表示

应用内部一律使用：

- 小写
- 无声调
- `ü` 统一表示为 `v`
- 不保留空格、撇号和数字声调

示例：

| 原始输入 | 内部形式 |
|---|---|
| `shuāng` | `shuang` |
| `lüè` | `lve` |
| `nǚ` | `nv` |
| `ma3` | `ma` |
| `Xiǎo` | `xiao` |

`normalizePinyin()` 必须完成：

1. 转为小写
2. 移除声调符号
3. 移除数字声调 `1–5`
4. 将 `ü`、`u:` 转为 `v`
5. 移除空格和撇号
6. 校验结果是否为合法拼音音节

特殊规则：

- `ju`、`qu`、`xu` 的单韵母 `u` 按 `v` 编码
- `jue/quе/xue` 按 `ue/ve` 对应键编码
- `juan/quan/xuan` 按 `uan` 对应键编码
- `jun/qun/xun` 按 `un` 对应键编码
- `y`、`w` 保留为普通声母
- 题库不得依赖运行时自动判断多音字

---

## 6. 声母映射

四种方案的声母映射相同：

| 声母 | 键 |
|---|---|
| b | b |
| p | p |
| m | m |
| f | f |
| d | d |
| t | t |
| n | n |
| l | l |
| g | g |
| k | k |
| h | h |
| j | j |
| q | q |
| x | x |
| zh | v |
| ch | i |
| sh | u |
| r | r |
| z | z |
| c | c |
| s | s |
| y | y |
| w | w |

拆分时必须优先匹配三字符或双字符声母：

```text
zh / ch / sh
```

然后再匹配单字符声母。

---

## 7. 韵母映射

### 7.1 小鹤双拼

| 韵母 | 键 | 韵母 | 键 |
|---|---:|---|---:|
| a | a | o / uo | o |
| e | e | i | i |
| u | u | v | v |
| iu | q | ei | w |
| uan | r | ue / ve | t |
| un | y | ong / iong | s |
| ie | p | ai | d |
| en | f | eng | g |
| ang | h | an | j |
| ing / uai | k | iang / uang | l |
| ou | z | ia / ua | x |
| ao | c | ui | v |
| in | b | iao | n |
| ian | m |  |  |

### 7.2 自然码

| 韵母 | 键 | 韵母 | 键 |
|---|---:|---|---:|
| a | a | o / uo | o |
| e | e | i | i |
| u | u | v | v |
| iu | q | ia / ua | w |
| uan | r | ue / ve | t |
| ing / uai | y | un | p |
| ong / iong | s | iang / uang | d |
| en | f | eng | g |
| ang | h | an | j |
| ao | k | ai | l |
| ei | z | ie | x |
| iao | c | ui | v |
| ou | b | in | n |
| ian | m |  |  |

### 7.3 搜狗双拼

| 韵母 | 键 | 韵母 | 键 |
|---|---:|---|---:|
| a | a | o / uo | o |
| e | e | i | i |
| u | u | v | y |
| iu | q | ia / ua | w |
| uan | r | ue / ve | t |
| uai | y | un | p |
| ong / iong | s | iang / uang | d |
| en | f | eng | g |
| ang | h | an | j |
| ao | k | ai | l |
| ing | `;` | ei | z |
| ie | x | iao | c |
| ui | v | ou | b |
| in | n | ian | m |

### 7.4 微软双拼

| 韵母 | 键 | 韵母 | 键 |
|---|---:|---|---:|
| a | a | o / uo | o |
| e | e | i | i |
| u | u | v | y |
| iu | q | ia / ua | w |
| er / uan | r | ue / ve | t |
| uai | y | un | p |
| ong / iong | s | iang / uang | d |
| en | f | eng | g |
| ang | h | an | j |
| ao | k | ai | l |
| ing | `;` | ei | z |
| ie | x | iao | c |
| ui | v | ou | b |
| in | n | ian | m |

微软兼容规则：

- `ue/ve` 的标准答案使用 `t`
- 校验层允许 `v` 作为兼容键
- UI、键位图和错误提示始终显示标准答案 `t`
- 兼容码只用于答案接受，不进入标准映射数据

---

## 8. 零声母规则

### 8.1 小鹤双拼、自然码

| 拼音 | 编码 |
|---|---|
| a | aa |
| ai | ai |
| an | an |
| ang | ah |
| ao | ao |
| e | ee |
| ei | ei |
| en | en |
| eng | eg |
| er | er |
| o | oo |
| ou | ou |

### 8.2 搜狗双拼、微软双拼

| 拼音 | 编码 |
|---|---|
| a | oa |
| ai | ol |
| an | oj |
| ang | oh |
| ao | ok |
| e | oe |
| ei | oz |
| en | of |
| eng | og |
| er | or |
| o | oo |
| ou | ob |

零声母必须优先于普通的“声母 + 韵母”编码流程处理。

---

## 9. 编码算法

建议接口：

```ts
type SchemeId = "xiaohe" | "microsoft" | "ziranma" | "sogou"

interface EncodeResult {
  normalized: string
  initial: string
  final: string
  canonical: string
  accepted: string[]
}

function encodeSyllable(
  pinyin: string,
  schemeId: SchemeId
): EncodeResult
```

执行顺序：

```text
输入拼音
→ 标准化
→ 检查零声母表
→ 拆分声母与韵母
→ 应用特殊拼音规则
→ 查找声母键
→ 查找韵母键
→ 生成标准答案
→ 追加方案兼容答案
```

失败时必须返回明确错误，不得猜测：

```ts
type EncodeError =
  | "INVALID_PINYIN"
  | "UNSUPPORTED_INITIAL"
  | "UNSUPPORTED_FINAL"
  | "MISSING_SCHEME_MAPPING"
```

UI 遇到题库编码失败时：

- 当前题目不得展示给用户
- 开发环境抛出错误
- 生产环境跳过该题并生成下一题
- 题库完整性测试必须阻止此类数据进入发布版本

---

## 10. 固定编码测试样例

以下结果作为 Vitest Fixture 和人工验收依据：

| 拼音 | 小鹤 | 自然码 | 搜狗 | 微软 |
|---|---:|---:|---:|---:|
| shuang | ul | ud | ud | ud |
| chuang | il | id | id | id |
| zhong | vs | vs | vs | vs |
| xiao | xn | xc | xc | xc |
| guang | gl | gd | gd | gd |
| liu | lq | lq | lq | lq |
| ming | mk | my | `m;` | `m;` |
| yue | yt | yt | yt | yt |
| lve | lt | lt | lt | lt |
| ju | jv | jv | jy | jy |
| jun | jy | jp | jp | jp |
| qing | qk | qy | `q;` | `q;` |
| kuai | kk | ky | ky | ky |
| shui | uv | uv | uv | uv |
| qiong | qs | qs | qs | qs |
| zhuang | vl | vd | vd | vd |
| ai | ai | ai | ol | ol |
| ang | ah | ah | oh | oh |
| er | er | er | or | or |
| ou | ou | ou | ob | ob |
| nü / nv | nv | nv | ny | ny |
| wei | ww | wz | wz | wz |
| yuan | yr | yr | yr | yr |

额外兼容测试：

```text
微软双拼：
lve → 标准 lt，同时接受 lv
nve → 标准 nt，同时接受 nv
```

---

## 11. 练习状态机

状态：

```ts
type SessionStatus =
  | "ready"
  | "answering"
  | "wrong"
  | "paused"
  | "completed"
```

转换：

```text
页面加载
→ ready
→ 生成题目
→ answering

answering + 正确答案
├── 未完成本组 → 更新统计 → 下一题 → answering
└── 已完成本组 → completed

answering + 错误答案
→ 记录错题
→ wrong

wrong + Enter
→ 下一题
→ answering

answering + Space
→ paused

paused + Space
→ answering

任意进行中状态 + 切换方案
→ 重置本组
→ 生成新方案题目
→ answering

任意进行中状态 + 切换模式
→ 重置本组
→ 生成新模式题目
→ answering

completed + 再练一组
→ 清空本组统计
→ answering

completed + 练习错题
→ 使用本组错题池
→ answering
```

错误状态规则：

- 错误后锁定当前输入
- 显示标准答案
- 显示声母与韵母拆解
- 高亮正确键位
- 不允许在原题上修改为正确答案
- 按 Enter 进入下一题
- Space 在错误状态不触发暂停
- 点击“下一题”按钮也可以继续

正确状态：

- `autoNext = true`：短暂反馈后自动进入下一题
- `autoNext = false`：显示正确反馈，按 Enter 进入下一题

切换以下设置必须重置当前组：

- 方案
- 练习模式
- 每组题数

切换以下设置不得重置：

- 显示拼音
- 显示键位图
- 音效
- 主题
- 错题优先

---

## 12. 三种练习模式

### 12.1 键位练习

题目类型：

```ts
type MappingQuestion =
  | { type: "initial"; value: "zh"; answer: "v" }
  | { type: "final"; value: "uang"; answer: "l" }
```

要求：

- 每题只输入一个键
- 页面明确显示“声母”或“韵母”
- 不出零声母题
- 同一题不得连续出现
- 当前方案不含的映射不得进入题池

### 12.2 单字练习

题目示例：

```ts
{
  id: "char-shuang",
  character: "双",
  pinyin: "shuang"
}
```

交互：

- 显示一个汉字
- 按设置决定是否显示拼音
- 用户输入一个双拼音节
- 达到标准答案长度后判断
- 搜狗、微软的分号键必须允许输入

### 12.3 词组练习

题目示例：

```ts
{
  id: "phrase-shuangpin",
  text: "双拼",
  syllables: ["shuang", "pin"]
}
```

交互：

- 显示完整词组
- 当前待输入汉字高亮
- 用户一次只输入当前汉字的双拼编码
- 当前汉字正确后移动到下一个汉字
- 当前汉字错误后锁定在该字并显示答案
- 完成整个词组后，计为完成一题
- 统计中的 `completed` 以词组数量计算，不以汉字数量计算
- 错题记录以 `题目 ID + 音节索引` 标识

---

## 13. 输入处理

`Input` 属性建议：

```tsx
<Input
  autoCapitalize="none"
  autoComplete="off"
  autoCorrect="off"
  spellCheck={false}
  inputMode="text"
/>
```

处理规则：

- 自动转小写
- 只保留 `a-z` 和 `;`
- 非法字符忽略
- 最大长度根据当前答案决定
- 中文输入法组合期间不判断答案
- `compositionend` 后重新清理输入
- 页面加载后自动聚焦
- 关闭 Popover、Drawer、Dialog 后恢复焦点
- 点击主练习区后恢复焦点
- `Esc` 清空当前输入
- `Space` 仅在输入为空且状态为 answering/paused 时控制暂停
- `Enter` 用于错误后继续、关闭正确反馈或开始下一组

---

## 14. 错题重现规则

MVP 不实现完整间隔重复。

数据：

```ts
interface MistakeRecord {
  questionKey: string
  count: number
  lastWrongAt: number
}
```

当前组内：

- 错题首次出现后，在未来第 3–8 题之间安排一次重现
- 同一错题不得连续出现
- 同一错题每组最多强制重现 2 次
- 错误次数增加时，提高普通随机出题中的权重
- 开启“错题优先”后，错题权重为普通题的 3 倍
- 关闭“错题优先”后仍记录错题，但不额外加权

若剩余题数不足 3 题，可以不在当前组强制重现。

---

## 15. Zustand Store 边界

唯一业务 Store：

```ts
interface PracticeStore {
  version: 1
  settings: PracticeSettings
  session: PracticeSession
  mistakes: Record<string, MistakeRecord>
  totals: PracticeTotals

  setScheme: (scheme: SchemeId) => void
  setMode: (mode: PracticeMode) => void
  updateSettings: (patch: Partial<PracticeSettings>) => void
  startSession: () => void
  submit: (input: string) => void
  next: () => void
  pause: () => void
  resume: () => void
  restart: () => void
  startMistakeSession: () => void
  clearHistory: () => void
}
```

持久化：

```ts
partialize: (state) => ({
  version: state.version,
  settings: state.settings,
  mistakes: state.mistakes,
  totals: state.totals,
})
```

不得持久化：

- 当前题目
- 当前输入
- 当前索引
- 当前组统计
- 暂停状态
- 弹窗状态
- Popover/Drawer 状态

组件本地 `useState` 管理：

- Popover 是否打开
- Drawer 是否打开
- Dialog 是否打开
- Tooltip 和临时动画

主题只由 `next-themes` 管理，不进入 Zustand。

---

## 16. 键位图规范

布局：

```ts
const keyboardRows = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m"],
]
```

每个键显示：

```text
┌──────────┐
│    Q     │  主键字母
│   iu     │  韵母
│          │  声母（没有则留空）
└──────────┘
```

存在多个韵母时使用 `/`：

```text
ing/uai
```

状态：

- 默认：普通边框
- 当前已输入：强调边框
- 正确答案：成功状态
- 错误输入：错误状态
- 同时存在时，正确答案优先显示成功状态

限制：

- 不显示 Shift、Tab、Caps Lock、Space
- 只显示三行字母与分号
- 桌面端完整显示
- 移动端保持最小可读键宽，容器横向滚动
- 不通过整体缩放把文字压到不可读
- 颜色之外必须同时使用边框或图标表达状态

---

## 17. 题库格式

单字：

```ts
export const characters: CharacterQuestion[] = [
  {
    id: "char-shuang",
    character: "双",
    pinyin: "shuang",
    weight: 100,
  },
  {
    id: "char-pin",
    character: "拼",
    pinyin: "pin",
    weight: 100,
  },
]
```

词组：

```ts
export const phrases: PhraseQuestion[] = [
  {
    id: "phrase-shuangpin",
    text: "双拼",
    syllables: ["shuang", "pin"],
    weight: 100,
  },
]
```

验证规则：

- ID 唯一
- 单字必须恰好一个汉字
- 词组文字数必须等于音节数
- 拼音必须已标准化
- 每个音节必须能被四种方案编码
- 不允许孤立多音字使用不明确读音
- 数据错误必须使测试失败

---

## 18. Playwright 验收用例

### 用例 1：完成一道单字题

```text
Given 打开首页
And 默认方案为小鹤双拼
When 页面展示一道单字题
And 输入该题正确编码
Then 进度增加
And 页面展示下一题
```

### 用例 2：切换方案

```text
Given 正在进行小鹤双拼练习
When 切换到微软双拼
Then 当前组被重置
And 新题使用微软双拼编码
And 显示重新开始的非阻断提示
```

### 用例 3：设置持久化

```text
Given 打开更多设置
When 关闭显示拼音
And 切换为自然码
And 刷新页面
Then 方案仍为自然码
And 拼音仍保持隐藏
And 当前题目和当前输入没有恢复
```

### 用例 4：移动端设置

```text
Given 使用手机视口打开首页
When 点击更多设置
Then 从底部打开 Drawer
When 修改每组题数并关闭 Drawer
Then 输入框重新获得焦点
And 可以完成一道题
```

---

## 19. 发布前人工核对

必须人工检查：

- 四种方案各随机抽查至少 20 个音节
- `zh/ch/sh`
- `ing`
- `iang/uang`
- `ong/iong`
- `iu/ui`
- `ue/ve`
- `v`
- 零声母 12 项
- 搜狗、微软的分号键
- 微软 `ue/ve` 兼容码
- 手机英文键盘
- 中文输入法误开启时的 composition 行为
- Popover、Drawer、Dialog 关闭后的焦点恢复

---

## 20. 外部核对资料

以下资料只用于核对规则，不作为代码底座：

- Rime 双拼方案：`rime/rime-double-pinyin`
- 纸砚双拼：`Yidadaa/shuangpin`
- 旧 Shuang：`BlueSky-07/Shuang`
- Linci 双拼页面：用于观察单主页面的产品取舍

执行 AI 不需要复制这些项目的源码。若映射存在争议，应：

1. 先以本文档为准
2. 对照至少两个独立来源
3. 增加固定测试
4. 在提交说明中记录差异
5. 不得静默修改本文档规定的标准答案
