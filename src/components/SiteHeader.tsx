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
const NAV = [{ href: "/about", label: "About" }] as const;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

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
