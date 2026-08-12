import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import "./keyboard-layout.css";

import { ThemeProvider } from "@/components/theme-provider";
import { StoreHydration } from "@/components/store-hydration";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SITE } from "@/lib/site";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const seoTitle = `${SITE.name} - 小鹤、微软、自然码、搜狗在线双拼练习与键位图`;

export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: seoTitle,
  description: SITE.description,
  authors: [{ name: SITE.author }],
  creator: SITE.author,
  alternates: { canonical: "/" },
  openGraph: {
    title: seoTitle,
    description: SITE.description,
    url: SITE.url,
    siteName: SITE.name,
    locale: "zh_CN",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: seoTitle,
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
          </TooltipProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
