import Link from "next/link";
import { NAV } from "@/lib/nav";
import styles from "./SiteFooter.module.css";

/** The footer (DESIGN_SPEC.md 7.5): navigation, one sentence about the project, the imagery rule, method and sources. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <div className={styles.about}>
        <p className={styles.mark}>Cosmic Archive</p>
        <p className={styles.line}>A living atlas of the universe: what we know, how we know it, and what nobody knows yet.</p>
        <p className={styles.line}>All imagery is illustration.</p>
      </div>
      <nav className={styles.nav} aria-label="Footer">
        {NAV.map((item) => (
          <Link key={item.href} href={item.href}>
            {item.label}
          </Link>
        ))}
        <Link href="/about#method">Method and sources</Link>
      </nav>
    </footer>
  );
}
