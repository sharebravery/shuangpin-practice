import { SITE } from "@/lib/site";

/**
 * 页脚（PRD §13）：保持克制的引流入口。
 */
export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-2 px-4 py-6 text-sm text-muted-foreground">
        <p>
          由{" "}
          <a
            href={SITE.url}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-foreground hover:underline"
          >
            {SITE.author}
          </a>{" "}
          制作
        </p>
        <p className="text-xs">
          {SITE.name} · 无后端、无登录，数据仅存于本地
        </p>
      </div>
    </footer>
  );
}
