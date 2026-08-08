import { SiteHeader } from "@/components/site-header";
import { SiteContent } from "@/components/site-content";
import { SiteFooter } from "@/components/site-footer";
import { PracticeWorkspace } from "@/features/practice/practice-workspace";

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
        <PracticeWorkspace />
      </main>
      <SiteContent />
      <SiteFooter />
    </>
  );
}
