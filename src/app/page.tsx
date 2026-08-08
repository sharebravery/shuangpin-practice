import { SiteHeader } from "@/components/site-header";
import { SiteContent } from "@/components/site-content";
import { SiteFooter } from "@/components/site-footer";
import { PracticeWorkspace } from "@/features/practice/practice-workspace";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-2 py-4 sm:px-4 sm:py-6">
        <PracticeWorkspace />
      </main>
      <SiteContent />
      <SiteFooter />
    </>
  );
}
