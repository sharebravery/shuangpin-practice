import type { PhraseQuestion } from "@/lib/shuangpin/types";

/**
 * 常用词组题库（50 个）。
 *
 * 约定：
 * - 每字拼音不带声调，用 v 表示 ü。
 * - syllables 长度必须等于 text 字数（由 bank.test 校验）。
 * - 多音字在词组语境下取固定读音（如「银行」的「行」= hang）。
 */
export const PHRASES: PhraseQuestion[] = [
  { id: "p001", text: "你好", syllables: ["ni", "hao"] },
  { id: "p002", text: "朋友", syllables: ["peng", "you"] },
  { id: "p003", text: "学习", syllables: ["xue", "xi"] },
  { id: "p004", text: "工作", syllables: ["gong", "zuo"] },
  { id: "p005", text: "时间", syllables: ["shi", "jian"] },
  { id: "p006", text: "中国", syllables: ["zhong", "guo"] },
  { id: "p007", text: "大家", syllables: ["da", "jia"] },
  { id: "p008", text: "现在", syllables: ["xian", "zai"] },
  { id: "p009", text: "今天", syllables: ["jin", "tian"] },
  { id: "p010", text: "明天", syllables: ["ming", "tian"] },
  { id: "p011", text: "昨天", syllables: ["zuo", "tian"] },
  { id: "p012", text: "早上", syllables: ["zao", "shang"] },
  { id: "p013", text: "晚上", syllables: ["wan", "shang"] },
  { id: "p014", text: "时候", syllables: ["shi", "hou"] },
  { id: "p015", text: "电话", syllables: ["dian", "hua"] },
  { id: "p016", text: "电脑", syllables: ["dian", "nao"] },
  { id: "p017", text: "手机", syllables: ["shou", "ji"] },
  { id: "p018", text: "电视", syllables: ["dian", "shi"] },
  { id: "p019", text: "生活", syllables: ["sheng", "huo"] },
  { id: "p020", text: "快乐", syllables: ["kuai", "le"] },
  { id: "p021", text: "高兴", syllables: ["gao", "xing"] },
  { id: "p022", text: "喜欢", syllables: ["xi", "huan"] },
  { id: "p023", text: "知道", syllables: ["zhi", "dao"] },
  { id: "p024", text: "问题", syllables: ["wen", "ti"] },
  { id: "p025", text: "答案", syllables: ["da", "an"] },
  { id: "p026", text: "老师", syllables: ["lao", "shi"] },
  { id: "p027", text: "学生", syllables: ["xue", "sheng"] },
  { id: "p028", text: "同学", syllables: ["tong", "xue"] },
  { id: "p029", text: "学校", syllables: ["xue", "xiao"] },
  { id: "p030", text: "医院", syllables: ["yi", "yuan"] },
  { id: "p031", text: "医生", syllables: ["yi", "sheng"] },
  { id: "p032", text: "身体", syllables: ["shen", "ti"] },
  { id: "p033", text: "名字", syllables: ["ming", "zi"] },
  { id: "p034", text: "家人", syllables: ["jia", "ren"] },
  { id: "p035", text: "父母", syllables: ["fu", "mu"] },
  { id: "p036", text: "兄弟", syllables: ["xiong", "di"] },
  { id: "p037", text: "姐妹", syllables: ["jie", "mei"] },
  { id: "p038", text: "事情", syllables: ["shi", "qing"] },
  { id: "p039", text: "地方", syllables: ["di", "fang"] },
  { id: "p040", text: "世界", syllables: ["shi", "jie"] },
  { id: "p041", text: "国家", syllables: ["guo", "jia"] },
  { id: "p042", text: "城市", syllables: ["cheng", "shi"] },
  { id: "p043", text: "街道", syllables: ["jie", "dao"] },
  { id: "p044", text: "商店", syllables: ["shang", "dian"] },
  { id: "p045", text: "超市", syllables: ["chao", "shi"] },
  { id: "p046", text: "饭店", syllables: ["fan", "dian"] },
  { id: "p047", text: "银行", syllables: ["yin", "hang"] },
  { id: "p048", text: "公园", syllables: ["gong", "yuan"] },
  { id: "p049", text: "车站", syllables: ["che", "zhan"] },
  { id: "p050", text: "飞机场", syllables: ["fei", "ji", "chang"] },
];
