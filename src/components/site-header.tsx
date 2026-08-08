import { buttonVariants } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { GithubIcon } from "@/components/icons/github-icon";
import { SITE } from "@/lib/site";
import { cn } from "@/lib/utils";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 bg-background/88 backdrop-blur-md">
      <div className="mx-auto flex h-12 w-full max-w-6xl items-center justify-between px-3 sm:px-6">
        <span className="text-sm font-semibold tracking-tight text-foreground">
          {SITE.name}
        </span>
        <div className="flex items-center gap-1">
          <ThemeToggle />
          <a
            href={SITE.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub 仓库"
            className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
          >
            <GithubIcon className="size-4" />
          </a>
        </div>
      </div>
    </header>
  );
}
