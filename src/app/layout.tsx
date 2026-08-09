import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "./keyboard-layout.css";

import { ThemeProvider } from "@/components/theme-provider";
import { StoreHydration } from "@/components/store-hydration";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { SITE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: `${SITE.name} - 打开即用的双拼键位练习`,
  description: SITE.description,
  keywords: [
    "双拼练习",
    "小鹤双拼",
    "微软双拼",
    "自然码双拼",
    "搜狗双拼",
    "双拼键位图",
    "双拼输入法",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: `${SITE.name} - 打开即用的双拼键位练习`,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE.name,
    description: SITE.description,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="zh-CN"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <ThemeProvider
          attribute="class"
          themes={["clean", "ink", "graphite"]}
          defaultTheme="clean"
          enableSystem={false}
          disableTransitionOnChange
        >
          <TooltipProvider>
            <StoreHydration />
            {children}
            <Toaster position="bottom-center" />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
