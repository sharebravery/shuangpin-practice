import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubIcon } from "@/components/icons/github-icon";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between px-4">
        <span className="text-base font-semibold tracking-tight">
          {SITE.name}
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            render={
              <a
                href={SITE.github}
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub 仓库"
              />
            }
          >
            <GithubIcon className="size-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
