import type { Metadata, Viewport } from "next";
import { Google_Sans_Flex, Hanken_Grotesk } from "next/font/google";
import type { ReactNode } from "react";
import { FirstLoad } from "@/components/FirstLoad";
import { Veil } from "@/components/screen/Veil";
import { SiteHeader } from "@/components/SiteHeader";
import { motionInitScript } from "@/lib/motion";
import { DEFAULT_OG, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { SceneHostLoader } from "@/scene/host/SceneHostLoader";
import "./globals.css";

/* Display and UI: Google Sans Flex, the face of the owner's Home.png (D-108; replaces Outfit, D-107). Text: Hanken Grotesk. */
const display = Google_Sans_Flex({
  subsets: ["latin"],
  weight: "variable",
  variable: "--font-display-face",
  adjustFontFallback: false, // Next has no metrics for this face yet; system-ui stands in while it loads
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
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: { type: "website", siteName: SITE_NAME, locale: "en_GB", images: [DEFAULT_OG] },
  twitter: { card: "summary_large_image", images: [DEFAULT_OG.url] },
};

export const viewport: Viewport = {
  themeColor: "#090a1c",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-motion="on" className={`${display.variable} ${hanken.variable}`} suppressHydrationWarning>
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
        <Veil />
        <FirstLoad />
      </body>
    </html>
  );
}
