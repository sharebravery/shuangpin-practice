import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubIcon } from "@/components/icons/github-icon";
import { SITE } from "@/lib/site";

export function SiteHeader() {
  return (
    <header className="bg-background/80 sticky top-0 z-40 backdrop-blur">
      <div className="mx-auto flex h-12 w-full max-w-4xl items-center justify-between px-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">
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
