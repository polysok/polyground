import type { Metadata } from "next";
import "./globals.css";
import "./inter/inter.css";
import type { Viewport } from "next";
import { Suspense } from "react";
import { ThemeProvider } from "@/components/theme-provider";
import {CLASS} from "postcss-selector-parser";

export const metadata: Metadata = {
  title: "Polyground",
  description: "Polyground",
  manifest: "/polyground/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
  themeColor: "#ffffff",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="main-font">
        <main>
          <ThemeProvider attribute="class" disableTransitionOnChange>
            <Suspense>{children}</Suspense>
          </ThemeProvider>
        </main>
      <div className="dark:hover:bg-slate-800"
      ></div>
      </body>
    </html>
  );
}
