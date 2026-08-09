/**
 * 双拼练习领域类型。
 * UI、状态管理和纯业务逻辑都基于这些最小类型。
 */

/** 支持的双拼方案 ID。 */
export type SchemeId = "xiaohe" | "microsoft" | "ziranma" | "sogou";

/** 练习模式：键位 / 单字 / 词组。 */
export type PracticeMode = "mapping" | "character" | "phrase";

/** 视觉布局：谱面 / 键盘。 */
export type PracticeLayout = "score" | "keyboard";

/** 双拼方案：声母、韵母、零声母到键位的映射。 */
export interface ShuangpinScheme {
  id: SchemeId;
  name: string;
  initials: Record<string, string>;
  finals: Record<string, string>;
  zeroInitials: Record<string, string>;
  /** 仅用于答案接受，不改变标准映射和键位图。 */
  finalCompat?: Record<string, string[]>;
}

export interface CharacterQuestion {
  id: string;
  character: string;
  /** 不带声调的拼音，如 "chuang"。 */
  pinyin: string;
  weight?: number;
}

export interface PhraseQuestion {
  id: string;
  text: string;
  syllables: string[];
  weight?: number;
}

/**
 * 用户真正需要控制的少量设置。
 * 练习节奏、错题复现和弱项加权由系统自动处理，不暴露额外参数。
 */
export interface PracticeSettings {
  scheme: SchemeId;
  mode: PracticeMode;
  showPinyin: boolean;
  showKeyboard: boolean;
  /** 可选以兼容旧的本地持久化数据；缺省按 score 处理。 */
  layout?: PracticeLayout;
  /** 可选以兼容旧的本地持久化数据；缺省按 true 处理。 */
  showTrace?: boolean;
}

/** 错题记录，仅用于后台自动复现和加权。 */
export interface MistakeRecord {
  count: number;
  lastSeen: number;
}
