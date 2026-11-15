import type { Metadata } from "next";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About",
  description: "Cosmic Archive is a living atlas of the universe, being built now.",
};

/* A stub until O1 writes the real About page (evidence legend and method). */
export default function About() {
  return (
    <article className={styles.page}>
      <h1 className={styles.title}>About</h1>
      <p>
        Cosmic Archive is a living atlas of the universe, and it is being built now. The atlas, the subject
        pages and the archive will open here one by one, each drawn as illustration and each claim tied to a
        source we have checked.
      </p>
    </article>
  );
}
