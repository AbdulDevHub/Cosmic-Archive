"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { toggleSound, useSound } from "@/lib/sound";
import { Dock } from "./Dock";
import { Emblem, SearchIcon } from "./icons";
import styles from "./SiteHeader.module.css";

/*
  The header (D-107, D-116): the emblem and the spaced wordmark on the left (it leads home, to
  the start page); in the middle the menu, the flared glass dock hanging from the top of the
  window; search and Sound on the right. The menu's sections and search are pages still to come:
  shown, marked "coming soon", doing nothing yet (the owner's call).
  On a phone the menu and search fold away; the wordmark and Sound stay.
*/

/** Asks the atlas to fly back out to its start page, when Home is pressed on `/` itself. */
export const HOME_EVENT = "cosmic:home";

export function SiteHeader() {
  const pathname = usePathname();
  const on = useSound((s) => s.enabled);
  const home = (event: MouseEvent) => {
    if (pathname !== "/" || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    window.dispatchEvent(new Event(HOME_EVENT));
  };

  return (
    <header className={styles.top} data-menu>
      <Link className={styles.wordmark} href="/" onClick={home}>
        <Emblem size={56} />
        <span className={styles.letters}>
          <span>Cosmic</span> <span>Archive</span>
        </span>
      </Link>

      <div className={styles.bar}>
        <Dock />
      </div>

      <div className={styles.tools}>
        <label className={styles.search} title="Search: coming soon">
          <SearchIcon />
          <input type="search" placeholder="Search the cosmos..." aria-label="Search the cosmos (coming soon)" disabled />
        </label>
        <button type="button" className={styles.sound} onClick={toggleSound} data-sound-toggle data-on={on ? "" : undefined} aria-pressed={on} aria-label="Sound" title={on ? "Sound on" : "Sound off"}>
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
        </button>
      </div>
    </header>
  );
}
