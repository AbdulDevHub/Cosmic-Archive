import Link from "next/link";
import styles from "./page.module.css";

/*
  Stage 1 of the homepage (DESIGN_SPEC.md 7.2), copy only. The atlas scene arrives in F3a
  through <SceneSlot>; until then the hero sits on plain --space.
  Both actions point at /about until /explore (F3b) and /archive (O1) exist.
*/
export default function Home() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <div className={styles.copy}>
        <h1 id="hero-title">Explore the extraordinary.</h1>
        <p>A living atlas of the universe, from the worlds around us to its deepest mysteries.</p>
        <div className={styles.actions}>
          <Link className={styles.go} href="/about">
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle className={styles.ticks} cx="32" cy="32" r="28" />
              <circle className={styles.dial} cx="32" cy="32" r="22" />
              <path className={styles.arrow} d="M24 32H40M34 26l6 6-6 6" />
              <circle className={styles.sat} cx="32" cy="10" r="2.4" />
            </svg>
            <span className={styles.word}>Begin exploring</span>
          </Link>
          <Link className={styles.index} href="/about">
            <i aria-hidden="true" />
            <span>Browse the archive</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
