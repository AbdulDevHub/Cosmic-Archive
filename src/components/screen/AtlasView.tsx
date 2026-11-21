"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { calm, diveInto, flowBusy, getFlow, useFlow } from "@/scene/host/flow";
import { playMusic, whoosh } from "@/lib/sound";
import { sceneParams } from "@/scene/host/params";
import { SceneSlot } from "@/scene/host/SceneSlot";
import {
  animateSceneInput,
  getSceneFrame,
  getSceneInput,
  getSceneState,
  sceneIsLive,
  setSceneInput,
  subscribeSceneFrame,
  useSceneState,
  ZOOM_MAX,
  ZOOM_MIN,
  type SceneFrame,
} from "@/scene/host/store";
import { HOME_EVENT } from "../SiteHeader";
import { DragHint } from "./DragHint";
import styles from "./screen.module.css";
import { StartScreen, type StartPhase } from "./StartScreen";
import { useGestures } from "./useGestures";

/*
  The universe (DESIGN_SPEC.md 7, D-092 and D-097): the atlas scene with three stops, 0 close in,
  1 the whole galaxy, 2 the cosmic web. A visitor moves by clicking: the two buttons glide from
  stop to stop, and a place's light dives into it and opens its page (the flow, D-096). The wheel,
  a pinch, a drag and the keys are there too, as extras.

  It is a plain page first: the words of the first stop, the places as a list of real links, and
  the buttons are all in the server HTML. Once the scene is drawn the places stand on the canvas.
*/

export interface StopWords {
  zoom: 0 | 1 | 2;
  name: string;
  line: string;
}

export interface Spot {
  id: string;
  name: string;
  /** The place's page, or null for a stop of the atlas itself (the galaxy, seen from the web). */
  href: string | null;
  anchor: string;
  /** The stop it is found at: 1 shows from close in to the whole galaxy, 2 on the web. */
  stop: 1 | 2;
  veil: string;
}

const POSTERS = { wide: "/posters/atlas-start-wide.webp", narrow: "/posters/atlas-start-narrow.webp" };

const STEP_MS = 1900;
const BEGIN_MS = 3800; // the flight from the start page to the galaxy
const BACK_MS = 2800; // and back out to it, from Home
const WHEEL_ZOOM = 0.0012; // one notch of a wheel is about an eighth of a stop
const DRAG_YAW = 0.005; // radians per pixel
const DRAG_PITCH = 0.003;
const KEY_ZOOM = 0.25;
const KEY_YAW = 0.15;
const KEY_PITCH = 0.06;
const PINCH_ZOOM = 1.1; // stops per halving of the distance between two fingers

/** Past this zoom the visitor is out on the cosmic web. */
const WEB_AT = 1.5;
const stopOf = (zoom: number) => Math.min(2, Math.max(0, Math.round(zoom))) as 0 | 1 | 2;
const spotShows = (spot: Spot, zoom: number) => (spot.stop === 2 ? zoom > 1.6 : zoom < 1.45);

export function AtlasView({ stops, spots }: { stops: readonly StopWords[]; spots: readonly Spot[] }) {
  const stage = useRef<HTMLDivElement>(null);
  const list = useRef<HTMLUListElement>(null);
  const live = useSceneState(sceneIsLive);
  const moving = useFlow((s) => s.phase !== "idle");
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  // The words follow the stop the scene drew; the server HTML has the opening view's (close in, D-112).
  const [stop, setStop] = useState<0 | 1 | 2>(0);
  const words = stops.find((entry) => entry.zoom === stop) ?? stops[0];
  // out on the web, Further has nowhere left to go
  const [atWeb, setAtWeb] = useState(false);
  const sync = () => setAtWeb(getSceneInput().zoom > WEB_AT);

  const glideTo = (zoom: number) => {
    if (flowBusy()) return;
    if (Math.abs(zoom - getSceneInput().zoom) > 0.05) whoosh("glide", STEP_MS / 1000);
    if (calm()) setSceneInput({ zoom });
    else animateSceneInput({ zoom }, STEP_MS);
    sync();
  };
  /**
   * The two buttons move between scenes only (D-112); the wheel and a pinch zoom freely. From the
   * galaxy, Closer dives into the black hole at its heart and Further glides out to the web; from
   * the web, Closer glides back in to the galaxy.
   */
  const closer = () => {
    if (flowBusy()) return;
    if (getSceneInput().zoom > WEB_AT) {
      glideTo(ZOOM_MIN);
      return;
    }
    const heart = spots.find((entry) => entry.anchor === "core");
    if (heart?.href) diveInto((href) => routerRef.current.push(href), heart.href, heart.anchor, heart.veil);
  };
  const further = () => {
    if (getSceneInput().zoom <= WEB_AT) glideTo(ZOOM_MAX);
  };

  // The start page (D-107): shown on arriving at `/` fresh, or by Home; not when the flow brings the
  // visitor back from a place, not for `/#atlas`, not for a still held at a stop. Begin (or the
  // wheel, or a swipe) is the way in: the music may start, and the camera flies to the galaxy.
  const [phase, setPhase] = useState<StartPhase>("start");
  const phaseRef = useRef<StartPhase>("start");
  const setStartPhase = (next: StartPhase) => {
    phaseRef.current = next;
    setPhase(next);
  };
  const wantsStart = () => {
    const params = sceneParams();
    return getFlow().phase === "idle" && window.location.hash !== "#atlas" && !(params.shot && params.zoom !== null);
  };
  const startsHere = useRef(true);
  const opening = () => {
    startsHere.current = wantsStart();
    return startsHere.current ? { intro: 1, zoom: ZOOM_MIN } : {};
  };
  useEffect(() => {
    // the slot asked first (a child's effect runs before its parent's); without a scene, ask here
    const start = getSceneState().slot ? startsHere.current : wantsStart();
    if (!start) setStartPhase("atlas");
  }, []);

  const leaving = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const begin = () => {
    if (phaseRef.current !== "start") return;
    playMusic();
    setStartPhase("leaving");
    clearTimeout(leaving.current);
    if (!live || calm()) {
      setSceneInput({ intro: 0 });
      leaving.current = setTimeout(() => setStartPhase("atlas"), live ? 260 : 0);
      return;
    }
    whoosh("in", BEGIN_MS / 1000);
    animateSceneInput({ intro: 0 }, BEGIN_MS);
    leaving.current = setTimeout(() => setStartPhase("atlas"), BEGIN_MS * 0.8);
  };
  const beginRef = useRef(begin);
  useEffect(() => {
    beginRef.current = begin;
  });

  // Home (the header's link or wordmark, on `/` itself) flies back out to the start page; the
  // Atlas link (`/#atlas`) skips it.
  useEffect(() => {
    const home = () => {
      if (phaseRef.current !== "atlas" || flowBusy()) return;
      clearTimeout(leaving.current);
      setStartPhase("start");
      if (!live || calm()) {
        setSceneInput({ intro: 1, zoom: ZOOM_MIN, yaw: 0, pitch: 0 });
        return;
      }
      whoosh("out", BACK_MS / 1000);
      animateSceneInput({ intro: 1, zoom: ZOOM_MIN, yaw: 0, pitch: 0 }, BACK_MS);
    };
    const hash = () => {
      if (window.location.hash === "#atlas") beginRef.current();
    };
    window.addEventListener(HOME_EVENT, home);
    window.addEventListener("hashchange", hash);
    return () => {
      window.removeEventListener(HOME_EVENT, home);
      window.removeEventListener("hashchange", hash);
      clearTimeout(leaving.current);
    };
  }, [live]);

  // Each drawn frame: the words' stop, and every place stood on its point.
  useEffect(() => {
    if (!live) return;
    const items = [...(list.current?.querySelectorAll<HTMLElement>("[data-anchor]") ?? [])];
    const apply = (frame: SceneFrame) => {
      setStop(stopOf(frame.zoom));
      // the buttons follow wherever the zoom was set from: a glide, the flow, the wheel
      setAtWeb(getSceneInput().zoom > WEB_AT);
      const busy = flowBusy() || phaseRef.current !== "atlas";
      for (const item of items) {
        const spot = spots.find((entry) => entry.anchor === item.dataset.anchor);
        const point = frame.points[item.dataset.anchor ?? ""];
        const inside = point && point.on && point.x > 8 && point.y > 8 && point.x < frame.width - 8 && point.y < frame.height - 8;
        const shows = !busy && !!spot && !!inside && spotShows(spot, frame.zoom);
        if (shows) {
          delete item.dataset.hidden;
          item.tabIndex = 0;
          item.style.transform = `translate(${point.x.toFixed(1)}px, ${point.y.toFixed(1)}px)`;
        } else {
          item.dataset.hidden = "";
          item.tabIndex = -1;
        }
      }
    };
    const frame = getSceneFrame();
    if (frame) apply(frame);
    const unsubscribe = subscribeSceneFrame(apply);
    return () => {
      unsubscribe();
      for (const item of items) {
        delete item.dataset.hidden;
        item.style.transform = "";
        item.removeAttribute("tabindex");
      }
    };
  }, [live, spots]);

  // Drag turns (and with a mouse, tilts); the wheel and a pinch zoom (useGestures).
  const swipe = useRef(0);
  useGestures(stage, live, {
    turn: (dx, dy, touch) => {
      if (phaseRef.current !== "atlas") {
        swipe.current += Math.abs(dx) + Math.abs(dy);
        if (touch && swipe.current > 60) beginRef.current();
        return;
      }
      const { yaw, pitch } = getSceneInput();
      setSceneInput(touch ? { yaw: yaw - dx * DRAG_YAW } : { yaw: yaw - dx * DRAG_YAW, pitch: pitch + dy * DRAG_PITCH });
    },
    pinch: (steps) => {
      if (phaseRef.current !== "atlas") return;
      setSceneInput({ zoom: getSceneInput().zoom + steps * PINCH_ZOOM });
      sync();
    },
    wheel: (pixels) => {
      if (phaseRef.current !== "atlas") {
        if (pixels > 0) beginRef.current();
        return;
      }
      setSceneInput({ zoom: getSceneInput().zoom + pixels * WHEEL_ZOOM });
      sync();
    },
  });

  // Keys, and a click on a place.
  useEffect(() => {
    const element = stage.current;
    if (!live || !element) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || flowBusy() || phaseRef.current !== "atlas") return;
      if ((event.target as HTMLElement).closest("input, textarea, select, [contenteditable]")) return;
      const { zoom, yaw, pitch } = getSceneInput();
      if (event.key === "+" || event.key === "=") setSceneInput({ zoom: zoom - KEY_ZOOM });
      else if (event.key === "-" || event.key === "_") setSceneInput({ zoom: zoom + KEY_ZOOM });
      else if (event.key === "Escape") further();
      else if (event.key === "ArrowLeft") setSceneInput({ yaw: yaw - KEY_YAW });
      else if (event.key === "ArrowRight") setSceneInput({ yaw: yaw + KEY_YAW });
      else if (event.key === "ArrowUp") setSceneInput({ pitch: pitch - KEY_PITCH });
      else if (event.key === "ArrowDown") setSceneInput({ pitch: pitch + KEY_PITCH });
      else return;
      event.preventDefault();
      sync();
    };

    // A place: dive into it, then open its page. The galaxy, seen from the web: glide back in.
    const onClick = (event: MouseEvent) => {
      const item = (event.target as Element).closest<HTMLElement>("[data-anchor]");
      if (!item || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const spot = spots.find((entry) => entry.anchor === item.dataset.anchor);
      if (!spot) return;
      event.preventDefault();
      if (flowBusy()) return;
      if (spot.href) diveInto((href) => routerRef.current.push(href), spot.href, spot.anchor, spot.veil);
      else glideTo(1);
    };

    element.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      element.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
    // `further`, `glideTo` and `sync` only read the store and set state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, spots]);

  return (
    <div ref={stage} className={styles.screen} data-live={live ? "" : undefined} data-moving={moving ? "" : undefined} data-start={phase !== "atlas" ? "" : undefined}>
      <SceneSlot id="atlas" mode="atlas" posters={POSTERS} opening={opening} />
      <StartScreen phase={phase} onBegin={begin} />

      <div className={styles.caption}>
        <div key={words.zoom} className={live ? styles.words : undefined}>
          <h1>{words.name}</h1>
          <p>{words.line}</p>
        </div>
        <ul ref={list} className={styles.spots} data-live={live ? "" : undefined} aria-label="Places">
          {spots.map((spot) => (
            <li key={spot.id}>
              {spot.href ? (
                <a className={styles.spot} href={spot.href} data-anchor={spot.anchor}>
                  <i className={styles.mark} aria-hidden="true" />
                  <span className={styles.name}>{spot.name}</span>
                </a>
              ) : live ? (
                <button type="button" className={styles.spot} data-anchor={spot.anchor}>
                  <i className={styles.mark} aria-hidden="true" />
                  <span className={styles.name}>{spot.name}</span>
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>

      <DragHint live={live} />
      {live ? (
        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={closer}>
            <i className={`${styles.icon} ${styles.closer}`} aria-hidden="true" />
            <span>Closer</span>
          </button>
          <button type="button" className={styles.control} onClick={() => !atWeb && further()} aria-disabled={atWeb}>
            <i className={`${styles.icon} ${styles.further}`} aria-hidden="true" />
            <span>Further</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
