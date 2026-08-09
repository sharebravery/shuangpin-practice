import { SiteHeader } from "@/components/site-header";
import { SiteContent } from "@/components/site-content";
import { SiteFooter } from "@/components/site-footer";
import { PracticeWorkspace } from "@/features/practice/practice-workspace";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto min-h-[calc(100svh-3rem)] w-full max-w-7xl px-3 pb-8 pt-3 sm:px-6 sm:pb-10 sm:pt-5">
        <PracticeWorkspace />
      </main>
      <SiteContent />
      <SiteFooter />
    </>
  );
}
