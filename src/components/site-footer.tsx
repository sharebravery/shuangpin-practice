import { SITE } from "@/lib/site";

/**
 * 页脚：保持克制的作者与数据说明。
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-border/55">
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-1.5 px-4 py-5 text-xs text-muted-foreground">
        <p>
          由{" "}
          <a
            href={SITE.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground/85 transition-colors hover:text-foreground"
          >
            {SITE.author}
          </a>{" "}
          制作
        </p>
        <p className="text-[0.68rem] text-muted-foreground/80">
          {SITE.name} · 无后端、无登录，数据仅存于本地
        </p>
      </div>
    </footer>
  );
}
