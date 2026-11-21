"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { toggleSound, useSound } from "@/lib/sound";
import styles from "./SiteHeader.module.css";

/*
  The header (DESIGN_SPEC.md 7.1): the wordmark, which leads home to the universe, and the Sound
  button. It has no background: every page is a scene.
*/

export function SiteHeader() {
  const pathname = usePathname();
  const on = useSound((s) => s.enabled);

  return (
    <header className={styles.top}>
      <Link className={styles.wordmark} href="/" aria-current={pathname === "/" ? "page" : undefined}>
        Cosmic Archive
      </Link>
      <button type="button" className={styles.sound} onClick={toggleSound} data-sound-toggle data-on={on ? "" : undefined} aria-pressed={on}>
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
          {on ? (
            <>
              <path d="M15.5 9a4.2 4.2 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </>
          ) : (
            <path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          )}
        </svg>
        <span>Sound</span>
      </button>
    </header>
  );
}
