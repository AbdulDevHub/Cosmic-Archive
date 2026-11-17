"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { destinationsAt, EVIDENCE_WORD, type AtlasAnchor, type AtlasLevel } from "@/lib/content/atlas";
import { clamp } from "@/lib/math";
import { getSceneFrame, subscribeSceneFrame, type SceneFrame } from "@/scene/host/store";
import styles from "./atlas.module.css";
import { EvidenceRing } from "./Evidence";
import { chooseLabel, labelRect, resolve, type Choice, type Offset, type Rect } from "./labels";
import { stageOpacity } from "./stages";

/*
  The beacons of one level of the atlas (DESIGN_SPEC.md 5 and 9, ARCHITECTURE.md 4).

  They are real links in a real list, in the server HTML. That list is what a visitor gets with
  no scene: a plain column of destinations. Once the scene is drawn (`live`), the same links are
  lifted out of the column and pinned to their places on the canvas, each with a leader line to
  its label. Nothing here is drawn by WebGL, so every beacon is focusable and clickable.
*/

/**
 * Where each label would like to hang, relative to its beacon: the approved prototype's
 * compositions for wide and for phone screens. `radius` offsets are fractions of the chart ring's
 * width on screen, so they follow the galaxy as it is zoomed; `px` offsets are short fixed leaders.
 */
const PREFER: Record<AtlasAnchor, { unit: "radius" | "px"; wide: [number, number]; narrow: [number, number]; flipPast?: [number, number] }> = {
  core: { unit: "radius", wide: [0.512, 0.386], narrow: [0.077, 0.98] },
  arm: { unit: "radius", wide: [-0.139, 0.269], narrow: [0.044, 0.507] },
  ring: { unit: "px", wide: [-52, 0], narrow: [-24, 0] },
  // its label turns inward once the beacon is this far across the screen (wide, narrow)
  quasar: { unit: "px", wide: [52, 0], narrow: [24, 0], flipPast: [0.62, 0.45] },
  home: { unit: "px", wide: [-52, 0], narrow: [-24, 0] },
};

const RELAYOUT_MS = 500;
const CALM_MS = 200;
const QUIET_MS = 300;
/** The elements of the page's copy that hold text. */
const WORDS = "h1, h2, h3, p, button, a:not([data-anchor])";
const HEADER = 64;
const EDGE = 12;
const RING_GAP = 11; // the leader starts at the ring, not at its centre

interface Item {
  anchor: AtlasAnchor;
  link: HTMLElement;
  label: HTMLElement;
  lead: HTMLElement;
  w: number;
  h: number;
  choice: Choice | null;
  drawn: string;
  angle: number;
  easing: ReturnType<typeof setTimeout> | undefined;
}

function preferred(anchor: AtlasAnchor, frame: SceneFrame, x: number): Offset {
  const p = PREFER[anchor];
  const [px, py] = frame.narrow ? p.narrow : p.wide;
  const k = p.unit === "radius" ? frame.radius : frame.narrow ? 1 : clamp(frame.width / 1200, 0.6, 1);
  const flip = p.flipPast && x > frame.width * p.flipPast[frame.narrow ? 1 : 0] ? -1 : 1;
  return { dx: px * k * flip, dy: py * k };
}

/** Where labels may stand: the window, less the header and a little air at the edges. */
function boundsOf(frame: SceneFrame): Rect {
  return { x: EDGE, y: HEADER, w: frame.width - 2 * EDGE, h: frame.height - HEADER - EDGE };
}

function useBeacons(listRef: React.RefObject<HTMLUListElement | null>, level: AtlasLevel, live: boolean): void {
  useEffect(() => {
    const list = listRef.current;
    if (!live || !list) return;

    const items: Item[] = [];
    for (const link of list.querySelectorAll<HTMLElement>("[data-anchor]")) {
      const label = link.querySelector<HTMLElement>("[data-label]");
      const lead = link.querySelector<HTMLElement>("[data-lead]");
      if (label && lead) items.push({ anchor: link.dataset.anchor as AtlasAnchor, link, label, lead, w: 0, h: 0, choice: null, drawn: "", angle: 0, easing: undefined });
    }

    // A short leader has four places to choose from and a long one has dozens, so the short ones
    // are placed first and the long ones work around them.
    const short = (item: Item) => (PREFER[item.anchor].unit === "px" ? 0 : 1);
    const inOrder = [...items].sort((a, b) => short(a) - short(b));

    let measured = false;
    let hidden = false;
    let disposed = false;
    let laidOut = -Infinity;
    let lastZoom = NaN;
    let calm: Rect[] = [];
    let words: Rect[] = [];
    let calmRead = -Infinity;
    const range = document.createRange();

    /**
     * The page's copy on screen. `calm` is each block of it, which labels keep off. `words` is the
     * text itself, line box by line box (a band such as the map margin counts whole): a beacon
     * may stand beside a short line of a wide column, but not on the letters.
     */
    const readCalm = (frame: SceneFrame, now: number) => {
      calmRead = now;
      calm = [];
      words = [];
      const keep = (list: Rect[], r: DOMRect) => {
        if (r.width > 0 && r.bottom > 0 && r.top < frame.height) list.push({ x: r.left, y: r.top, w: r.width, h: r.height });
      };
      for (const element of document.querySelectorAll<HTMLElement>("[data-calm]")) {
        if (getComputedStyle(element).visibility === "hidden") continue;
        const box = element.getBoundingClientRect();
        keep(calm, box);
        if (element.dataset.calm === "band") {
          keep(words, box);
          continue;
        }
        const blocks = element.matches(WORDS) ? [element] : element.querySelectorAll<HTMLElement>(WORDS);
        for (const block of blocks) {
          if (block.closest("[data-anchor]") || getComputedStyle(block).visibility === "hidden") continue;
          range.selectNodeContents(block);
          keep(words, range.getBoundingClientRect());
        }
      }
    };
    /** A beacon turned or zoomed under the page's words gives way to them; the list view still has it. */
    const underWords = (x: number, y: number) =>
      words.some((r) => x > r.x - RING_GAP && x < r.x + r.w + RING_GAP && y > r.y - RING_GAP && y < r.y + r.h + RING_GAP);

    /** Puts the label and its leader at `offset`. A change of place eases; following the zoom does not. */
    const draw = (item: Item, offset: Offset, ease: boolean) => {
      const key = `${offset.dx.toFixed(1)},${offset.dy.toFixed(1)}`;
      if (key === item.drawn) return;
      item.drawn = key;
      if (ease) {
        item.link.dataset.easing = "";
        clearTimeout(item.easing);
        item.easing = setTimeout(() => delete item.link.dataset.easing, 340);
      }
      // keep the angle within half a turn of the last one, so an eased leader takes the short way round
      let angle = Math.atan2(offset.dy, offset.dx);
      while (angle - item.angle > Math.PI) angle -= 2 * Math.PI;
      while (angle - item.angle < -Math.PI) angle += 2 * Math.PI;
      item.angle = angle;
      const left = offset.dx < 0;
      item.link.dataset.side = left ? "left" : "right";
      item.label.style.transform = `translate(${offset.dx.toFixed(1)}px, ${offset.dy.toFixed(1)}px) translate(${left ? "-100%" : "0%"}, -8px)`;
      item.lead.style.transform = `rotate(${angle.toFixed(4)}rad) translateX(${RING_GAP}px) scaleX(${Math.max(0, Math.hypot(offset.dx, offset.dy) - RING_GAP).toFixed(1)})`;
    };

    const layout = (frame: SceneFrame) => {
      if (!measured) {
        for (const item of items) {
          item.w = item.label.offsetWidth;
          item.h = item.label.offsetHeight;
        }
        measured = true;
      }
      readCalm(frame, performance.now());
      // the words count twice: in a wide column a label may have to stand in the block, never on its text
      const obstacles: Rect[] = [...calm, ...words];
      for (const item of items) {
        const point = frame.points[item.anchor];
        if (point && !underWords(point.x, point.y)) obstacles.push({ x: point.x - 14, y: point.y - 14, w: 28, h: 28 });
      }
      const bounds = boundsOf(frame);
      for (const item of inOrder) {
        const point = frame.points[item.anchor];
        if (!point?.on || underWords(point.x, point.y)) continue;
        const prefer = preferred(item.anchor, frame, point.x);
        // a beacon's own ring is not in its label's way
        const others = obstacles.filter((o) => !(o.w === 28 && o.x === point.x - 14 && o.y === point.y - 14));
        const square = PREFER[item.anchor].unit === "px";
        const label = { x: point.x, y: point.y, w: item.w, h: item.h, prefer };
        const next = chooseLabel({ ...label, square, current: item.choice }, { bounds, obstacles: others, shade: frame.shade });
        const moved = item.choice !== null && (item.choice.turn !== next.turn || item.choice.scale !== next.scale);
        item.choice = next;
        const offset = resolve(label, next, bounds);
        draw(item, offset, moved);
        obstacles.push(labelRect(point.x, point.y, offset, item.w, item.h));
      }
    };

    const apply = (frame: SceneFrame) => {
      const showing = stageOpacity(frame.zoom)[level] > 0.02;
      if (!showing) {
        // off stage: the links must not stay where they last stood, clickable over other scenery
        if (!hidden) for (const item of items) item.link.style.visibility = "hidden";
        hidden = true;
        return;
      }
      hidden = false;
      const now = performance.now();
      const settled = Math.abs(frame.zoom - lastZoom) < 0.002;
      lastZoom = frame.zoom;
      if (now - calmRead > CALM_MS) readCalm(frame, now); // the words fade and move with the zoom, between layouts too
      // a beacon with no place yet, and somewhere to stand, is laid out at once
      const first = items.some((item) => {
        const point = frame.points[item.anchor];
        return item.choice === null && !!point && point.on && !underWords(point.x, point.y);
      });
      if (first || (settled && now - laidOut > RELAYOUT_MS)) {
        laidOut = now;
        layout(frame);
      }
      for (const item of items) {
        const point = frame.points[item.anchor];
        const on =
          !!point && point.on && point.x > -40 && point.x < frame.width + 40 && point.y > -40 && point.y < frame.height + 40 && !underWords(point.x, point.y);
        item.link.style.visibility = on ? "inherit" : "hidden";
        if (!on || !point) continue;
        item.link.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)`;
        // between layouts the offset still follows the zoom, and the label stays on screen
        if (item.choice) {
          const label = { x: point.x, y: point.y, w: item.w, h: item.h, prefer: preferred(item.anchor, frame, point.x) };
          draw(item, resolve(label, item.choice, boundsOf(frame)), false);
        }
      }
    };

    /** Lays out again on the frame we have, reading the page afresh. */
    const again = () => {
      if (disposed) return; // the fonts can settle after the list has gone back to plain links
      laidOut = -Infinity;
      calmRead = -Infinity;
      const current = getSceneFrame();
      if (current) apply(current);
    };
    // label sizes change with the fonts and the window
    const remeasure = () => {
      measured = false;
      again();
    };
    const fonts = document.fonts;
    fonts?.ready.then(remeasure).catch(() => {});
    window.addEventListener("resize", remeasure);

    // A still scene (paused, reduced motion) draws only when asked, and the page shows and hides
    // its words after this list has read them. So once frames stop coming, look once more: the
    // layout must see the page as the visitor does.
    let quiet: ReturnType<typeof setTimeout> | undefined;
    const unsubscribe = subscribeSceneFrame((frame) => {
      apply(frame);
      clearTimeout(quiet);
      quiet = setTimeout(again, QUIET_MS);
    });
    // and one animation frame after the first, for the same reason
    const start = requestAnimationFrame(again);

    return () => {
      disposed = true;
      unsubscribe();
      clearTimeout(quiet);
      cancelAnimationFrame(start);
      window.removeEventListener("resize", remeasure);
      for (const item of items) {
        clearTimeout(item.easing);
        delete item.link.dataset.easing;
        delete item.link.dataset.side;
        item.link.style.transform = "";
        item.link.style.visibility = "";
        item.label.style.transform = "";
        item.lead.style.transform = "";
      }
    };
  }, [listRef, level, live]);
}

interface BeaconListProps {
  level: AtlasLevel;
  /** True once the scene is drawn: the links leave the list and stand on the canvas. */
  live: boolean;
}

export function BeaconList({ level, live }: BeaconListProps) {
  const ref = useRef<HTMLUListElement>(null);
  useBeacons(ref, level, live);

  return (
    <ul ref={ref} className={styles.beacons} data-live={live ? "" : undefined}>
      {destinationsAt(level).map((destination) => (
        <li key={destination.id}>
          <Link className={styles.beacon} href={destination.href} data-anchor={destination.anchor}>
            <EvidenceRing evidence={destination.evidence} />
            <span className={styles.lead} data-lead aria-hidden="true" />
            <span className={styles.label} data-label>
              {destination.label}
              <span className={styles.note}>{destination.note}</span>
              <span className={styles.status}>{EVIDENCE_WORD[destination.evidence]}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
