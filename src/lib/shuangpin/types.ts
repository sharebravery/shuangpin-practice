/**
 * 双拼练习领域类型（对应技术架构文档第 6 节）。
 * 这些类型与 UI、Zustand 解耦，纯业务逻辑与数据均基于它们。
 */

/** 第一版支持的双拼方案 ID。 */
export type SchemeId = "xiaohe" | "microsoft" | "ziranma" | "sogou";

/** 练习模式：键位 / 单字 / 词组。 */
export type PracticeMode = "mapping" | "character" | "phrase";

/** 视觉布局：谱面为默认，键盘保留更具实体感的呈现。 */
export type PracticeLayout = "score" | "keyboard";

/**
 * 双拼方案：声母、韵母、零声母到键位的映射。
 * 映射方向为「拼音部件 -> 键位字母」。
 */
export interface ShuangpinScheme {
  id: SchemeId;
  name: string;
  initials: Record<string, string>;
  finals: Record<string, string>;
  /** 零声母音节（如 a、o、e、er、ang 等）的编码规则。 */
  zeroInitials: Record<string, string>;
  /**
   * 韵母兼容键（如微软双拼 ve 标准为 t，兼容接受 v）。
   * 只用于答案接受，不进入标准映射数据，不影响 UI 与键位图。
   */
  finalCompat?: Record<string, string[]>;
}

/** 单字题目。 */
export interface CharacterQuestion {
  id: string;
  character: string;
  /** 不带声调的拼音，如 "chuang"。 */
  pinyin: string;
  weight?: number;
}

/** 词组题目。 */
export interface PhraseQuestion {
  id: string;
  text: string;
  /** 每个汉字对应的不带声调拼音，长度必须等于 text 字数。 */
  syllables: string[];
  weight?: number;
}

/** 用户练习设置。 */
export interface PracticeSettings {
  scheme: SchemeId;
  mode: PracticeMode;
  questionsPerSession: number;
  showPinyin: boolean;
  showKeyboard: boolean;
  autoNext: boolean;
  mistakePriority: boolean;
  layout: PracticeLayout;
  showTrace: boolean;
}

/** 错题记录（简单错题机制，非完整间隔重复）。 */
export interface MistakeRecord {
  /** 错误次数，越多越可能重新出现。 */
  count: number;
  /** 上次出现的题目序号，用于避免过快重复。 */
  lastSeen: number;
}
