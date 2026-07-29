import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "katex/dist/katex.min.css";
import "./globals.css";

import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "Lumen — Turn anything into knowledge",
    template: "%s · Lumen",
  },
  description:
    "Lumen is an AI learning workspace. Upload documents, videos, audio or slides and get beautiful editable notes, flashcards, quizzes and a tutor that knows your material.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdfcfa" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0f" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans`}
        style={
          {
            "--font-sans": GeistSans.style.fontFamily,
            "--font-mono": GeistMono.style.fontFamily,
          } as React.CSSProperties
        }
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
