import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE } from "@/lib/site";

/** 首屏之后的说明与 SEO 内容，不干扰练习主舞台。 */
export function SiteContent() {
  const itemClassName = "border-border/55";
  const triggerClassName =
    "py-3 text-muted-foreground transition-colors hover:text-foreground hover:no-underline";
  const contentClassName =
    "pb-4 leading-7 text-muted-foreground [&_code]:rounded-sm [&_code]:bg-muted/60 [&_code]:px-1 [&_code]:py-0.5 [&_strong]:font-medium [&_strong]:text-foreground";

  return (
    <section className="mx-auto w-full max-w-3xl px-4 py-12 sm:py-16">
      <header className="max-w-2xl">
        <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          在线双拼练习与键位图
        </h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          {SITE.name} 支持小鹤双拼、微软双拼、自然码双拼和搜狗双拼。
          无需登录，打开即可进行键位、单字和词组练习，输入轨迹与正确键位会直接显示在键位图上。
        </p>
      </header>

      <div className="mt-9 grid gap-8 sm:grid-cols-2 sm:gap-10">
        <section aria-labelledby="what-is-shuangpin">
          <h2 id="what-is-shuangpin" className="text-sm font-semibold text-foreground">
            什么是双拼
          </h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            双拼把一个拼音音节拆成声母和韵母，并分别映射到两个键位，因此大多数汉字可以用两次按键完成编码。
            例如「窗」的拼音是 chuang，在小鹤双拼中对应 <code>i</code>（ch）和 <code>l</code>（uang）。
          </p>
        </section>

        <section aria-labelledby="supported-schemes">
          <h2 id="supported-schemes" className="text-sm font-semibold text-foreground">
            支持的双拼方案
          </h2>
          <p className="mt-2 leading-7 text-muted-foreground">
            当前支持小鹤双拼、微软双拼、自然码双拼、搜狗双拼四种方案。
            不同方案主要差异在声母、韵母的键位映射；切换方案后，练习题编码与双拼键位图会同步更新。
          </p>
        </section>
      </div>

      <section className="mt-9 border-y border-border/55 py-6" aria-labelledby="how-to-practice">
        <h2 id="how-to-practice" className="text-sm font-semibold text-foreground">
          怎么练双拼
        </h2>
        <ol className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground sm:grid-cols-3 sm:gap-6">
          <li>
            <strong>先认键位：</strong>用「键位」模式熟悉声母和韵母映射。
          </li>
          <li>
            <strong>再练单字：</strong>看到汉字与拼音后，直接输入两键编码形成肌肉记忆。
          </li>
          <li>
            <strong>最后练词组：</strong>连续处理多个音节，逐渐减少对键位图的依赖。
          </li>
        </ol>
      </section>

      <Accordion className="mt-7">
        <AccordionItem value="usage" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>使用方法与快捷键</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <ul className="ml-4 list-disc">
              <li>选择双拼方案与练习模式后，直接输入编码即可开始。</li>
              <li>输入会即时校验；答对直接进入下一题，答错显示正确编码与拆解后重新输入当前题。</li>
              <li><code>Esc</code> 清空当前输入。</li>
              <li><code>Space</code> 在输入为空时暂停或继续。</li>
              <li>点击主练习区可重新聚焦输入。</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>常见问题</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>
              <strong>为什么有的字显示分号？</strong>
              搜狗、微软双拼的 <code>ing</code> 韵母使用分号键，例如「名」对应 <code>m</code> + <code>;</code>；
              小鹤双拼的 <code>ing</code> 使用 <code>k</code> 键，例如「名」对应 <code>m</code> + <code>k</code>。请使用英文键盘输入。
            </p>
            <p>
              <strong>刷新后设置还在吗？</strong>
              方案、模式与显示设置会保存在浏览器本地，刷新后保留；当前题目与输入不会恢复。
            </p>
            <p>
              <strong>练习数据会上传吗？</strong>
              不会。{SITE.name} 无账号、无后端，练习设置、累计统计和错题记录等练习数据仅保存在当前浏览器本地。
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="project" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>关于珠落</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>
              {SITE.name} 希望把双拼练习做得简单、直接：打开页面即可开始，不需要额外设置。
              项目源码已在{" "}
              <a href={SITE.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              开源，欢迎反馈与改进。
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="author" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>关于{SITE.author}</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>
              本工具由{SITE.author}制作。希望它保持简单、直接，让你打开页面就能开始练习双拼。
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </section>
  );
}
