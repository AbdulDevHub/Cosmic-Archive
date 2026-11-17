import Link from "next/link";
import { EvidenceLine } from "@/components/atlas/Evidence";
import { DESTINATIONS, EVIDENCE_WORD } from "@/lib/content/atlas";
import { TEASERS } from "@/lib/content/home";
import { getSubject } from "@/lib/content/subjects";
import styles from "./home.module.css";

/*
  Destinations (DESIGN_SPEC.md 7.5): the four flagships, each a window of its own shape onto a
  still of our own scenes, with its name and one sentence. Not four identical cards: a round
  window for the black hole, a wide oval for the galaxy, an arch for the nebulae, a slit onto the
  cosmic web for the quasars. A destination whose page is written is a link; one still being
  written says so and is not a link (no dead links).

  The stills come from `npm run posters` (`window-*`). Nebulae and quasars have no scene of their
  own yet, so their windows look at the place on the atlas where they are found.
*/

interface Window {
  id: string;
  shape: "round" | "oval" | "arch" | "slit";
  image: string;
  width: number;
  height: number;
  /** What the window shows. Always an illustration (PROJECT_BLUEPRINT.md 6.3). */
  shows: string;
}

const WINDOWS: readonly Window[] = [
  { id: "black-holes", shape: "round", image: "/posters/window-black-holes.webp", width: 720, height: 720, shows: "the black-hole scene" },
  { id: "galaxies", shape: "oval", image: "/posters/window-galaxies.webp", width: 960, height: 640, shows: "the atlas galaxy" },
  { id: "nebulae", shape: "arch", image: "/posters/window-nebulae.webp", width: 480, height: 607, shows: "an arm of the atlas galaxy" },
  { id: "quasars", shape: "slit", image: "/posters/window-quasars.webp", width: 960, height: 320, shows: "a thread of the cosmic web" },
];

export function Destinations() {
  return (
    <section id="destinations" className={styles.section} aria-labelledby="destinations-title">
      <h2 id="destinations-title">Four places to start</h2>
      <ul className={styles.windows}>
        {WINDOWS.map((window) => {
          const destination = DESTINATIONS.find((entry) => entry.id === window.id);
          if (!destination) throw new Error(`Destinations: no destination "${window.id}"`);
          const subject = getSubject(window.id);
          const line = subject?.hook ?? TEASERS.find((teaser) => teaser.id === window.id)?.line;
          if (!line) throw new Error(`Destinations: no line for "${window.id}"`);
          const title = subject?.title ?? destination.label;

          const body = (
            <>
              <span className={styles.frame}>
                {/* decorative: the words beside it say what it is. A plain img: the still is already
                    made at its size by `npm run posters`, and the page needs no image runtime. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={window.image} width={window.width} height={window.height} alt="" loading="lazy" decoding="async" />
              </span>
              <span className={styles.caption}>Illustration: {window.shows}</span>
              <span className={styles.name}>{title}</span>
              <span className={styles.line}>{line}</span>
              <span className={styles.status}>
                <EvidenceLine evidence={destination.evidence} />
                {EVIDENCE_WORD[destination.evidence]}
              </span>
              <span className={subject ? styles.go : styles.later}>{subject ? "Read the page" : "Page being written"}</span>
            </>
          );

          return (
            <li key={window.id} className={styles.window} data-shape={window.shape}>
              {subject ? (
                <Link className={styles.windowLink} href={`/subjects/${window.id}`}>
                  {body}
                </Link>
              ) : (
                <div className={styles.windowLink}>{body}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
