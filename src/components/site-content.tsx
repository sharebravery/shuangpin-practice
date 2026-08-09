import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SITE } from "@/lib/site";

/**
 * 页面说明：默认折叠，保持在练习首屏之后。
 * Server Component，纯静态内容。
 */
export function SiteContent() {
  const itemClassName = "border-border/55";
  const triggerClassName =
    "py-3 text-muted-foreground transition-colors hover:text-foreground hover:no-underline";
  const contentClassName =
    "pb-4 leading-7 text-muted-foreground [&_code]:rounded-sm [&_code]:bg-muted/60 [&_code]:px-1 [&_code]:py-0.5 [&_strong]:font-medium [&_strong]:text-foreground";

  return (
    <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:py-12">
      <Accordion>
        <AccordionItem value="what" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>什么是双拼</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>
              双拼是一种汉字输入方式，把每个汉字的拼音拆成「声母」和「韵母」两部分，
              分别对应键盘上的一个键，因此每个汉字只需按两下键即可输入。
              例如「窗」拼音为 chuang，在小鹤双拼中按 <code>i</code>（ch）和 <code>l</code>（uang）即可。
            </p>
            <p>
              双拼保留了拼音输入的习惯，同时大幅减少击键次数，是提升中文输入效率的常用方案。
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="schemes" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>支持哪些方案</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>当前支持四种主流双拼方案：</p>
            <ul className="ml-4 list-disc">
              <li>小鹤双拼</li>
              <li>微软双拼</li>
              <li>自然码双拼</li>
              <li>搜狗双拼</li>
            </ul>
            <p>
              在顶部切换方案后，键位图与编码规则会立即更新。微软双拼的{" "}
              <code>üe</code> 韵母标准键为 <code>t</code>，同时兼容接受 <code>v</code>。
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="usage" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>使用方法与快捷键</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <ul className="ml-4 list-disc">
              <li>选择方案与模式后，直接输入双拼编码即可开始练习。</li>
              <li>达到答案长度会自动判断；答对直接进入下一题，答错显示正确编码与拆解后继续。</li>
              <li><code>Esc</code> 清空当前输入。</li>
              <li><code>Space</code> 在输入为空时暂停或继续。</li>
              <li><code>Enter</code> 可在答错提示期间提前进入下一题。</li>
              <li>点击主练习区可重新聚焦输入。</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="faq" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>常见问题</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>
              <strong>为什么有的字显示分号？</strong>
              搜狗、微软双拼的 <code>ing</code> 韵母使用分号键，例如「名」对应{" "}
              <code>m</code> + <code>;</code>；小鹤双拼的 <code>ing</code> 使用{" "}
              <code>k</code> 键，例如「名」对应 <code>m</code> + <code>k</code>。请使用英文键盘输入。
            </p>
            <p>
              <strong>刷新后设置还在吗？</strong>
              方案、模式与显示设置会保存在浏览器本地，刷新后保留；当前题目与输入不会恢复。
            </p>
            <p>
              <strong>数据会上传吗？</strong>
              不会。本工具无后端、无账号，所有练习数据仅保存在本地浏览器。
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="project" className={itemClassName}>
          <AccordionTrigger className={triggerClassName}>项目说明与开源</AccordionTrigger>
          <AccordionContent className={contentClassName}>
            <p>
              {SITE.name} 是一个无后端、无登录的静态双拼练习工具，目标是打开即用。
              项目源码开源在{" "}
              <a href={SITE.github} target="_blank" rel="noreferrer">
                GitHub
              </a>
              ，欢迎反馈与改进。
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
