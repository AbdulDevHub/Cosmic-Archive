import type { Metadata, Viewport } from "next";
import { Hanken_Grotesk, Syne } from "next/font/google";
import type { ReactNode } from "react";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { motionInitScript } from "@/lib/motion";
import { SceneHostLoader } from "@/scene/host/SceneHostLoader";
import "./globals.css";

/* Display: Syne 600 (D-026). Text and UI: Hanken Grotesk; its italic is for map notes. */
const syne = Syne({
  subsets: ["latin"],
  weight: "600",
  variable: "--font-syne",
  display: "swap",
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Cosmic Archive",
    template: "%s · Cosmic Archive",
  },
  description: "A living atlas of the universe, from the worlds around us to its deepest mysteries.",
};

export const viewport: Viewport = {
  themeColor: "#090a1c",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-motion="on" className={`${syne.variable} ${hanken.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: motionInitScript }} />
      </head>
      <body>
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SceneHostLoader />
        <SiteHeader />
        <main id="content">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
