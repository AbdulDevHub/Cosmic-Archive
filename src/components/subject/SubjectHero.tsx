"use client";

import { useRef, type ReactNode } from "react";
import { SceneSlot, type ScenePosters } from "@/scene/host/SceneSlot";
import { sceneIsLive, useSceneState, type SceneFrame, type SceneId } from "@/scene/host/store";
import atlas from "../atlas/atlas.module.css";
import { useCanvasLabels, type LabelRule } from "../atlas/useCanvasLabels";
import styles from "./subject.module.css";

/*
  The top of a subject page (DESIGN_SPEC.md 8): the subject's own scene, with the title and the
  one-sentence hook. The scene is the top of the page only; the article slides up over it.

  The callouts name what is in the picture. In the server HTML they are a plain list under the
  hook. Once the scene is drawn (`live`) they are lifted out and pinned to the places the scene
  reports, each on a leader line, like the atlas's labels. They are notes, not links, so they
  carry a plain ink dot and not a beacon.
*/

export interface HeroCallout {
  anchor: string;
  label: string;
  note: string;
}

/**
 * Where each callout would like to hang, by anchor, as fractions of the subject's size on
 * screen. One entry per place a subject scene can name (the scenes' `ANCHORS`).
 */
const PREFER: Readonly<Record<string, LabelRule>> = {
  // black-hole
  shadow: { unit: "radius", wide: [0.3, 0.52], narrow: [0.12, 0.88] },
  lensed: { unit: "radius", wide: [0.26, -0.3], narrow: [-0.3, -0.45] },
  disc: { unit: "radius", wide: [0.06, 0.42], narrow: [0.08, 1.2] },
  bright: { unit: "radius", wide: [0.2, -0.36], narrow: [-0.67, -0.25] },
  // atlas, in the Galaxies framing: the labels hang outside the bright disc where they can
  core: { unit: "radius", wide: [-0.25, 0.95], narrow: [0.1, 1.0] },
  arm: { unit: "radius", wide: [-0.85, 0.05], narrow: [-0.06, 1.4] },
  dust: { unit: "radius", wide: [0.27, -0.44], narrow: [0.55, -0.15] },
  companion: { unit: "radius", wide: [-0.5, -0.1], narrow: [0.6, -0.25] },
  // nebula: the labels hang in the dark sky above and beside the cloud
  pillar: { unit: "radius", wide: [-0.8, 0.45], narrow: [-0.45, 0.85] },
  cluster: { unit: "radius", wide: [0.55, -0.95], narrow: [0.22, -0.35] },
  front: { unit: "radius", wide: [-0.45, -0.55], narrow: [0.1, -0.95] },
  glow: { unit: "radius", wide: [0.1, 0.7], narrow: [0.35, 0.75] },
};

const ALWAYS = (frame: SceneFrame) => frame.width > 0;

interface SubjectHeroProps {
  scene: SceneId | null;
  posters: ScenePosters | null;
  callouts: readonly HeroCallout[];
  /** The title, hook and status line, rendered on the server. */
  children: ReactNode;
}

export function SubjectHero({ scene, posters, callouts, children }: SubjectHeroProps) {
  const list = useRef<HTMLUListElement>(null);
  const live = useSceneState(sceneIsLive);
  useCanvasLabels(list, live, PREFER, ALWAYS, true);

  return (
    <>
      {/* the first screen of the page: while it is in view the scene runs */}
      <div className={styles.sceneBox} data-clear-header>{scene && posters ? <SceneSlot id={scene} mode="subject" posters={posters} /> : null}</div>
      <header className={styles.hero}>
        <div className={styles.heroCopy} data-calm>
          {children}
          {callouts.length > 0 ? (
            <ul ref={list} className={`${atlas.beacons} ${styles.callouts}`} data-live={live ? "" : undefined} aria-label="In this picture">
              {callouts.map((callout) => (
                <li key={callout.anchor}>
                  <span className={`${atlas.beacon} ${styles.callout}`} data-anchor={callout.anchor}>
                    <i className={styles.dot} aria-hidden="true" />
                    <span className={atlas.lead} data-lead aria-hidden="true" />
                    <span className={atlas.label} data-label>
                      {callout.label}
                      <span className={atlas.note}>{callout.note}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {scene ? (
          <p className={styles.caption} data-calm>
            Illustration, not to scale
          </p>
        ) : null}
      </header>
    </>
  );
}
