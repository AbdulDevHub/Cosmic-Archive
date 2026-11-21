"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { levelCopy } from "@/lib/content/atlas";
import { SceneSlot } from "@/scene/host/SceneSlot";
import {
  getSceneFrame,
  getSceneInput,
  sceneIsLive,
  setSceneInput,
  subscribeSceneFrame,
  useSceneState,
  ZOOM_MAX,
  ZOOM_MIN,
  type SceneFrame,
} from "@/scene/host/store";
import { BeaconList } from "./BeaconList";
import styles from "./ExploreAtlas.module.css";
import { MapMargin } from "./MapMargin";
import { fade, stageOpacity, unfade } from "./stages";

/*
  The atlas under free control (ARCHITECTURE.md 2 and 4): the wheel, a pinch and the + and - keys
  pull back or move closer; a drag or the left and right arrow keys turn the chart; a mouse drag or
  the up and down arrow keys (with focus in the atlas) tilt it; and two
  buttons step between the views for anyone using none of these. A one-finger swipe up or down
  still scrolls the page.

  Following a beacon eases the camera a little toward the galaxy and lets the words fade before
  the subject page opens (D-083). With reduced motion, or a modified click, the link just opens.

  Like the homepage, it is a plain page first: the words, both levels' destinations as lists and
  the map margin are all in the server HTML. The controls appear once the scene is drawn.
*/

const POSTERS = {
  wide: "/posters/atlas-chart-wide.webp",
  narrow: "/posters/atlas-chart-narrow.webp",
};

const CHART = levelCopy(1);
const WEB = levelCopy(2);

const WHEEL_ZOOM = 0.0012; // one notch of a wheel is about an eighth of a level
const DRAG_YAW = 0.005; // radians per pixel
const DRAG_PITCH = 0.003;
const KEY_ZOOM = 0.25;
const KEY_YAW = 0.15;
const KEY_PITCH = 0.06;
const PINCH_ZOOM = 1.1; // levels per halving of the distance between two fingers
const LEAVE_MS = 520;
const LEAVE_ZOOM = 0.35;

export function ExploreAtlas() {
  const stage = useRef<HTMLDivElement>(null);
  const intro = useRef<HTMLDivElement>(null);
  const near = useRef<HTMLDivElement>(null);
  const far = useRef<HTMLDivElement>(null);
  const margin = useRef<HTMLDivElement>(null);
  const caption = useRef<HTMLParagraphElement>(null);
  const live = useSceneState(sceneIsLive);
  const router = useRouter();
  // read through a ref: the router's identity can change between renders, and the controls'
  // effect must not re-run (and cancel a beacon's pending navigation) when it does
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  // which of the two step buttons has nowhere left to go
  const [limit, setLimit] = useState<"near" | "far" | null>(null);

  const zoomTo = (zoom: number) => {
    setSceneInput({ zoom });
    const now = getSceneInput().zoom;
    setLimit(now <= ZOOM_MIN ? "near" : now >= ZOOM_MAX ? "far" : null);
  };
  /** The next whole view in a direction: from between two views, the nearer one first. */
  const step = (direction: 1 | -1) => {
    const { zoom } = getSceneInput();
    zoomTo(direction > 0 ? Math.floor(zoom + 1) : Math.ceil(zoom - 1));
  };

  // The zoom the scene drew decides which level's words, beacons and margin show.
  useEffect(() => {
    if (!live) return;
    const faded = [near, far, margin, caption];
    let lifted = 0;
    const apply = (frame: SceneFrame) => {
      const [o0, o1, o2] = stageOpacity(frame.zoom);
      fade(near.current, Math.max(o0, o1));
      fade(far.current, o2);
      fade(margin.current, o2);
      fade(caption.current, 1 - o2);
      // Phone: the words stand at the bottom, so they rise to make room for the margin. A margin,
      // not a transform: a transform would re-anchor the beacons inside, which are fixed to the canvas.
      const lift = frame.narrow && margin.current ? Math.round(margin.current.offsetHeight * o2) : 0;
      if (intro.current && lift !== lifted) {
        lifted = lift;
        intro.current.style.marginBottom = lift ? `${lift}px` : "";
      }
    };
    const frame = getSceneFrame();
    if (frame) apply(frame);
    const unsubscribe = subscribeSceneFrame(apply);
    const introElement = intro.current;
    return () => {
      unsubscribe();
      for (const ref of faded) unfade(ref.current);
      if (introElement) introElement.style.marginBottom = "";
    };
  }, [live]);

  // Wheel, drag and keys.
  useEffect(() => {
    const element = stage.current;
    if (!live || !element) return;

    const sync = () => {
      const { zoom } = getSceneInput();
      setLimit(zoom <= ZOOM_MIN ? "near" : zoom >= ZOOM_MAX ? "far" : null);
    };

    // The wheel zooms while there is somewhere to zoom to. At either end, and whenever the page
    // is already scrolled, it scrolls the page as usual: the footer is never out of reach.
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return; // the browser's own zoom, and a trackpad pinch
      const { zoom } = getSceneInput();
      const out = event.deltaY > 0;
      if (window.scrollY > 0 || (out ? zoom >= ZOOM_MAX : zoom <= ZOOM_MIN)) return;
      event.preventDefault();
      const pixels = event.deltaMode === 1 ? event.deltaY * 32 : event.deltaY;
      setSceneInput({ zoom: zoom + pixels * WHEEL_ZOOM });
      sync();
    };

    // Pointers down on the atlas, by id. One mouse or pen: turn and tilt. One finger: turn (a
    // swipe up or down is the page's scroll, so it does not tilt). Two fingers: pinch to zoom. No
    // two-finger tilt: with `pan-y` the browser may claim a vertical two-finger move as a scroll
    // and cancel the pointers mid-gesture (D-082).
    const pointers = new Map<number, { x: number; y: number; touch: boolean }>();
    const pair = () => {
      const [a, b] = [...pointers.values()];
      return { distance: Math.hypot(a.x - b.x, a.y - b.y) };
    };
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element).closest("a, button")) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, touch: event.pointerType === "touch" });
      element.setPointerCapture(event.pointerId);
      element.dataset.dragging = "";
    };
    const onMove = (event: PointerEvent) => {
      const last = pointers.get(event.pointerId);
      if (!last) return;
      const { zoom, yaw, pitch } = getSceneInput();
      if (pointers.size >= 2) {
        const before = pair();
        last.x = event.clientX;
        last.y = event.clientY;
        const after = pair();
        if (before.distance > 0 && after.distance > 0) {
          setSceneInput({ zoom: zoom + Math.log2(before.distance / after.distance) * PINCH_ZOOM });
          sync();
        }
        return;
      }
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      last.x = event.clientX;
      last.y = event.clientY;
      setSceneInput(last.touch ? { yaw: yaw - dx * DRAG_YAW } : { yaw: yaw - dx * DRAG_YAW, pitch: pitch + dy * DRAG_PITCH });
    };
    const onUp = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      if (pointers.size === 0) delete element.dataset.dragging;
    };

    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      if (target !== document.body && !element.contains(target)) return;
      const { zoom, yaw, pitch } = getSceneInput();
      // up and down tilt only with focus in the atlas; from the page itself they scroll it
      const inside = target !== document.body;
      if (event.key === "+" || event.key === "=") setSceneInput({ zoom: zoom - KEY_ZOOM });
      else if (event.key === "-" || event.key === "_") setSceneInput({ zoom: zoom + KEY_ZOOM });
      else if (event.key === "ArrowLeft") setSceneInput({ yaw: yaw - KEY_YAW });
      else if (event.key === "ArrowRight") setSceneInput({ yaw: yaw + KEY_YAW });
      else if (inside && event.key === "ArrowUp") setSceneInput({ pitch: pitch - KEY_PITCH });
      else if (inside && event.key === "ArrowDown") setSceneInput({ pitch: pitch + KEY_PITCH });
      else return;
      event.preventDefault();
      sync();
    };

    // Following a beacon: ease toward the galaxy, let the words fade, then open the page.
    let leaving: ReturnType<typeof setTimeout> | undefined;
    let leavingTo: string | null = null;
    const onClick = (event: MouseEvent) => {
      const link = (event.target as Element).closest<HTMLAnchorElement>("a[data-anchor]");
      if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      if (matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.motion === "paused") return;
      const href = link.getAttribute("href");
      if (!href?.startsWith("/")) return;
      event.preventDefault();
      if (leaving) return;
      element.dataset.leaving = "";
      leavingTo = href;
      setSceneInput({ zoom: Math.max(ZOOM_MIN, getSceneInput().zoom - LEAVE_ZOOM) });
      leaving = setTimeout(() => {
        leavingTo = null; // opened: the cleanup below must not open it twice
        routerRef.current.push(href);
      }, LEAVE_MS);
    };

    element.addEventListener("click", onClick);
    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    document.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(leaving);
      // the click was already taken from the link: if the page is still to open, open it now
      if (leaving && leavingTo) routerRef.current.push(leavingTo);
      delete element.dataset.leaving;
      element.removeEventListener("click", onClick);
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      document.removeEventListener("keydown", onKey);
      delete element.dataset.dragging;
    };
  }, [live]);

  return (
    <div ref={stage} className={styles.stage} data-live={live ? "" : undefined} data-clear-header>
      <SceneSlot id="atlas" mode="explore" posters={POSTERS} />
      <a className="skip-link" href="#destinations">
        Skip to destinations
      </a>

      <div ref={intro} className={styles.intro} data-calm>
        <h1 id="explore-title">Explore the atlas</h1>
        <div className={styles.levels}>
          <div ref={near} className={styles.level}>
            <p>{CHART.text}</p>
            <BeaconList level={1} live={live} />
          </div>
          <div ref={far} className={`${styles.level} ${styles.far}`}>
            <p>
              {WEB.heading} {WEB.text}
            </p>
            <BeaconList level={2} live={live} />
          </div>
        </div>
        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={() => limit !== "near" && step(-1)} aria-disabled={limit === "near"}>
            <i className={styles.closer} aria-hidden="true" />
            <span>Move closer</span>
          </button>
          <button type="button" className={styles.control} onClick={() => limit !== "far" && step(1)} aria-disabled={limit === "far"}>
            <i className={styles.back} aria-hidden="true" />
            <span>Pull back</span>
          </button>
          <a className={styles.control} href="#destinations">
            <i className={styles.list} aria-hidden="true" />
            <span>List view</span>
          </a>
        </div>
        <p className={styles.how}>Scroll, pinch or press + and − to zoom. Drag or use the arrow keys to turn.</p>
      </div>

      <div ref={margin} className={styles.margin} data-calm="band">
        <MapMargin />
      </div>
      <p ref={caption} className={styles.caption} data-calm>
        Illustration, not to scale
      </p>
    </div>
  );
}
