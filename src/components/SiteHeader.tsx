"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { NAV } from "@/lib/nav";
import { PauseMotion } from "./PauseMotion";
import styles from "./SiteHeader.module.css";

/*
  The header (DESIGN_SPEC.md 7.1): the wordmark, which leads home to the universe, About, and
  Pause motion. Over a scene it has no background; on About it turns solid once the page scrolls.
*/

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
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
