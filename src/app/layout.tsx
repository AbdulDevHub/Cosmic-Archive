import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex, Hanken_Grotesk, Syncopate } from "next/font/google";
import Script from "next/script";
import type { ReactNode } from "react";
import { FirstLoad } from "@/components/FirstLoad";
import { FlightBar } from "@/components/screen/FlightBar";
import { Veil } from "@/components/screen/Veil";
import { SiteHeader } from "@/components/SiteHeader";
import { menuFlights, menuGroups } from "@/lib/content/menu";
import { motionInitScript } from "@/lib/motion";
import { DEFAULT_OG, SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, SITE_URL } from "@/lib/site";
import { SceneHostLoader } from "@/scene/host/SceneHostLoader";
import "./globals.css";

/* Display and UI: Google Sans Flex, the face of the owner's start-page-mockup.png (D-108; replaces Outfit, D-107). Text: Hanken Grotesk. */
const display = Google_Sans_Flex({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-display-face",
  adjustFontFallback: false, // Next has no metrics for this face yet; system-ui stands in while it loads
  display: "swap",
});

/* The wordmark alone (D-203): Syncopate, wide geometric capitals with a space-age feel, only the letters it spells. */
const logo = Syncopate({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-logo",
  display: "swap",
  preload: true,
});

const hanken = Hanken_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-hanken",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: ["interactive universe", "3D space explorer", "universe simulation", "galaxy", "black hole", "nebula", "quasar", "solar system", "cosmic web", "space in the browser", "WebGL", "multiverse", "omniverse"],
  category: "science",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  // D-207: Google Search Console's HTML-tag check. Set NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel to the
  // `content` value Search Console gives (the tag is left out until then)
  ...(process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { verification: { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } } : {}),
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_GB", images: [DEFAULT_OG] },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG.url] },
};

export const viewport: Viewport = {
  themeColor: "#090a1c",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-motion="on" className={`${display.variable} ${hanken.variable} ${logo.variable}`} suppressHydrationWarning>
      <body>
        {/* sets data-motion before the page hydrates; next/script, since React 19 warns about a raw <script> in a component */}
        <Script id="motion-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: motionInitScript }} />
        <a className="skip-link" href="#content">
          Skip to content
        </a>
        <SceneHostLoader />
        <SiteHeader groups={menuGroups()} flights={menuFlights()} />
        <main id="content">{children}</main>
        <Veil />
        <FlightBar />
        <FirstLoad />
      </body>
    </html>
  );
}
