"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PauseMotion } from "./PauseMotion";
import styles from "./SiteHeader.module.css";

/**
 * Only routes that exist. Planned order (DESIGN_SPEC.md 7.1): Explore, Journeys, Archive, About.
 * Add each one here in the session that builds its route.
 */
const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/about", label: "About" },
] as const;

const BAR_HEIGHT = 64;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // The bar turns solid once the page scrolls (DESIGN_SPEC.md 7.1), but not over a scene that
    // fills the screen (an element marked data-clear-header): there the scenery is the background.
    const update = () => {
      const clear = document.querySelector("[data-clear-header]");
      const overScene = !!clear && clear.getBoundingClientRect().bottom > BAR_HEIGHT;
      setScrolled(window.scrollY > 8 && !overScene);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [pathname]);

  return (
    <header className={styles.top} data-scrolled={scrolled ? "" : undefined}>
      <Link className={styles.wordmark} href="/" aria-current={pathname === "/" ? "page" : undefined}>
        Cosmic Archive
      </Link>
      <nav className={styles.nav} aria-label="Main">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
            {item.label}
          </Link>
        ))}
      </nav>
      <PauseMotion />
    </header>
  );
}
