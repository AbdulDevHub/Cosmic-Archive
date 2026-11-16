import Link from "next/link";
import { SceneSlot } from "@/scene/host/SceneSlot";
import styles from "./page.module.css";

/*
  Stage 1 of the homepage (DESIGN_SPEC.md 7.2): the hero over the atlas scene. The poster is
  in the server HTML; the live scene fades in over it. The chart and zoom out arrive in F3b.
  Both actions point at /about until /explore (F3b) and /archive (O1) exist.
*/
const POSTERS = {
  wide: "/posters/atlas-hero-wide.webp",
  narrow: "/posters/atlas-hero-narrow.webp",
};

export default function Home() {
  return (
    <section className={styles.hero} aria-labelledby="hero-title">
      <SceneSlot id="atlas" mode="hero" posters={POSTERS} />
      <p className={styles.caption}>Illustration, not to scale</p>
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
