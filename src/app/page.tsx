import { SiteHeader } from "@/components/site-header";
import { SiteContent } from "@/components/site-content";
import { SiteFooter } from "@/components/site-footer";
import { PracticeWorkspace } from "@/features/practice/practice-workspace";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl px-3 pb-3 pt-2 sm:px-6 sm:pb-5 sm:pt-4">
        <PracticeWorkspace />
      </main>
      <SiteContent />
      <SiteFooter />
    </>
  );
}
