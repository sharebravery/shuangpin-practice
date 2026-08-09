import { SITE } from "@/lib/site";

/** 页脚：保留产品说明，并轻量回链到作者主页。 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/55">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-1.5 px-4 py-5 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/85">{SITE.name}</p>
        <a
          className="transition-colors hover:text-foreground"
          href={SITE.home}
          target="_blank"
          rel="noreferrer"
        >
          More by {SITE.author} ↗
        </a>
        <p className="text-[0.68rem] text-muted-foreground/80">
          无后端、无登录，数据仅存于本地
        </p>
      </div>
    </footer>
  );
}
