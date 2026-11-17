import Link from "next/link";
import styles from "./SiteFooter.module.css";

/** Minimal footer for the scaffold. The full footer (navigation, method and sources) comes with O1. */
export function SiteFooter() {
  return (
    <footer className={styles.footer}>
      <p className={styles.mark}>Cosmic Archive</p>
      <p className={styles.line}>A living atlas of the universe, being built. All imagery is illustration.</p>
      <nav className={styles.nav} aria-label="Footer">
        <Link href="/explore">Explore</Link>
        <Link href="/about">About</Link>
      </nav>
    </footer>
  );
}
