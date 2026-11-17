"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { NAV } from "@/lib/nav";
import { PauseMotion } from "./PauseMotion";
import styles from "./SiteHeader.module.css";

const BAR_HEIGHT = 64;

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openedAt, setOpenedAt] = useState(pathname);
  const button = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // a new page closes the menu (state adjusted during render, not in an effect)
  if (openedAt !== pathname) {
    setOpenedAt(pathname);
    setOpen(false);
  }

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

  // Phone menu (DESIGN_SPEC.md 7.1, D-031): a full-screen list. While it is open the page behind
  // does not scroll, Escape closes it, and focus goes in and comes back to the button.
  useEffect(() => {
    if (!open) return;
    const root = document.documentElement;
    root.dataset.menu = "open";
    // the page behind is covered, so it leaves the tab order too
    const behind = [...document.querySelectorAll<HTMLElement>("body > main, body > footer, body > .skip-link")];
    for (const element of behind) element.inert = true;
    menu.current?.querySelector("a")?.focus();
    // the menu is a phone control: a window that grows past it closes the menu
    const wide = window.matchMedia("(min-width: 721px)");
    const onWide = () => wide.matches && setOpen(false);
    wide.addEventListener("change", onWide);
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      delete root.dataset.menu;
      for (const element of behind) element.inert = false;
      window.removeEventListener("keydown", onKey);
      wide.removeEventListener("change", onWide);
    };
  }, [open]);

  return (
    <header className={styles.top} data-scrolled={scrolled || open ? "" : undefined}>
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
      <button
        ref={button}
        className={styles.menuButton}
        type="button"
        aria-expanded={open}
        aria-controls="site-menu"
        onClick={() => setOpen((value) => !value)}
      >
        <i aria-hidden="true" />
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      <div ref={menu} id="site-menu" className={styles.menu} hidden={!open}>
        {/* a link to the page already open does not change the path, so any link closes the menu */}
        <nav aria-label="Menu" onClick={(event) => (event.target as HTMLElement).closest("a") && setOpen(false)}>
          <ul>
            <li>
              <Link href="/" aria-current={pathname === "/" ? "page" : undefined}>
                Home
              </Link>
            </li>
            {NAV.map((item) => (
              <li key={item.href}>
                <Link href={item.href} aria-current={pathname === item.href ? "page" : undefined}>
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
