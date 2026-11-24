"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { calm, diveInto, flowBusy, getFlow, useFlow } from "@/scene/host/flow";
import { playMusic, playSample, setMusic } from "@/lib/sound";
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
import { ZoomOutIcon } from "../icons";
import { VideoButton } from "./VideoButton";
import { HOME_EVENT } from "../SiteHeader";
import { DragHint } from "./DragHint";
import { setVia } from "@/lib/via";
import styles from "./screen.module.css";
import { StartScreen, type StartPhase } from "./StartScreen";
import { useGestures } from "./useGestures";

/*
  The universe (DESIGN_SPEC.md 7, D-092 and D-097): the atlas scene with four stops, 0 close in,
  1 the whole galaxy, 2 the cosmic web, 3 the supervoid around it (D-119), 4 the observable universe (D-130). A visitor moves by clicking: the two buttons glide from
  stop to stop, and a place's light dives into it and opens its page (the flow, D-096). The wheel,
  a pinch, a drag and the keys are there too, as extras.

  It is a plain page first: the words of the first stop, the places as a list of real links, and
  the buttons are all in the server HTML. Once the scene is drawn the places stand on the canvas.
*/

export interface StopWords {
  zoom: 0 | 1 | 2 | 3 | 4 | 5;
  name: string;
  line: string;
  /** A video about it on YouTube (D-141). */
  video?: string;
}

export interface Spot {
  id: string;
  name: string;
  /** The place's page, or null for a stop of the atlas itself (the galaxy, seen from the web). */
  href: string | null;
  anchor: string;
  /** The stop it is found at: 1 shows from close in to the whole galaxy, 2 on the web, 3 in the supervoid, 4 in the universe, 5 in the Seven Heavens. */
  stop: 1 | 2 | 3 | 4 | 5;
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

/** Past this zoom the visitor is out on the cosmic web; past the next, out in the supervoid (D-119); past the last, out in the universe (D-130). */
const WEB_AT = 1.5;
const VOID_AT = 2.5;
const UNIVERSE_AT = 3.5;
/** Past this, out in the Seven Heavens (D-174). */
const HEAVENS_AT = 4.5;
/** The observable universe's stop: `/#universe` opens there, and the heavens glide back to it. */
const UNIVERSE_STOP = 4;
/** The supervoid's stop: `/#supervoid` opens there (D-119). */
const VOID_STOP = 3;
type Level = 1 | 2 | 3 | 4 | 5;
const levelAt = (zoom: number): Level => (zoom > HEAVENS_AT ? 5 : zoom > UNIVERSE_AT ? 4 : zoom > VOID_AT ? 3 : zoom > WEB_AT ? 2 : 1);
const spotShows = (spot: Spot, zoom: number) =>
  spot.stop === 5 ? zoom > 4.65 : spot.stop === 4 ? zoom > 3.65 && zoom < 4.35 : spot.stop === 3 ? zoom > 2.65 && zoom < 3.35 : spot.stop === 2 ? zoom > 1.6 && zoom < 2.35 : zoom < 1.45;
/** The addresses that skip the start page, and the stop each opens at. */
const OPENS_AT: Record<string, number> = { "#atlas": ZOOM_MIN, "#supervoid": VOID_STOP, "#universe": UNIVERSE_STOP, "#heavens": ZOOM_MAX };

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
  // one name for the galaxy, close in or whole (D-115); the web's beyond WEB_AT, the supervoid's beyond VOID_AT
  const [stop, setStop] = useState<Level>(1);
  const words = stops.find((entry) => entry.zoom === stop) ?? stops[0];
  // the level the camera is headed for (tests read it as `data-web`, `data-void` and `data-universe`); Zoom Out is dimmed at the last
  const [level, setLevel] = useState<Level>(1);
  // the supervoid's foam is pinned to space, so a drag there would slide the voids over the web (D-137)
  const inVoid = () => levelAt(getSceneInput().zoom) === 3;
  const sync = () => setLevel(levelAt(getSceneInput().zoom));
  // the galaxy, the web, the supervoid and the universe have their own music (D-116)
  useEffect(() => setMusic(level >= 4 ? "universe" : level === 3 ? "supervoid" : level === 2 ? "web" : "galaxy"), [level]);

  const glideTo = (zoom: number) => {
    if (flowBusy()) return;
    if (Math.abs(zoom - getSceneInput().zoom) > 0.05) playSample("travel");
    if (calm()) setSceneInput({ zoom });
    else animateSceneInput({ zoom }, STEP_MS);
    sync();
  };
  /**
   * One button, Zoom Out (D-117, D-119, D-130): out one level, from the galaxy to the cosmic web,
   * from the web to the supervoid, from the supervoid to the observable universe. There it is dimmed.
   * Places, the galaxy from the web, the web from the supervoid and the supervoid from the universe are entered by clicking them;
   * the wheel and a pinch zoom both ways.
   */
  const back = () => {
    const at = levelAt(getSceneInput().zoom);
    if (flowBusy() || at === 5) return;
    glideTo(at + 1);
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
    return getFlow().phase === "idle" && !(window.location.hash in OPENS_AT) && !(params.shot && params.zoom !== null);
  };
  const startsHere = useRef(true);
  const opening = () => {
    startsHere.current = wantsStart();
    if (startsHere.current) return { intro: 1, zoom: ZOOM_MIN };
    // `/#supervoid` (where `/supervoid` now leads, D-119) opens out in the supervoid, `/#universe` out in the universe
    const hash = window.location.hash;
    return (hash === "#supervoid" || hash === "#universe" || hash === "#heavens") && getFlow().phase === "idle" && !sceneParams().shot ? { zoom: OPENS_AT[hash] } : {};
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
    playSample("journey");
    animateSceneInput({ intro: 0 }, BEGIN_MS);
    leaving.current = setTimeout(() => setStartPhase("atlas"), BEGIN_MS * 0.8);
  };
  const beginRef = useRef(begin);
  const glideRef = useRef(glideTo);
  useEffect(() => {
    beginRef.current = begin;
    glideRef.current = glideTo;
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
      playSample("travel");
      animateSceneInput({ intro: 1, zoom: ZOOM_MIN, yaw: 0, pitch: 0 }, BACK_MS);
    };
    const hash = () => {
      if (window.location.hash === "#atlas") beginRef.current();
      else if (window.location.hash === "#supervoid" || window.location.hash === "#universe" || window.location.hash === "#heavens") {
        if (phaseRef.current === "start") beginRef.current();
        glideRef.current(OPENS_AT[window.location.hash]);
      }
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
      setStop(levelAt(frame.zoom));
      // the buttons follow wherever the zoom was set from: a glide, the flow, the wheel
      setLevel(levelAt(getSceneInput().zoom));
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
      if (inVoid()) return;
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
      else if (event.key === "Escape") back();
      else if (event.key.startsWith("Arrow") && inVoid()) return;
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
      if (spot.href) {
        setVia(spot.id, null); // found from the atlas: its Zoom Out comes back here (D-133)
        diveInto((href) => routerRef.current.push(href), spot.href, spot.anchor, spot.veil);
      }
      else if (spot.stop === 5) glideTo(UNIVERSE_STOP); // the universe, seen from the heavens: back to it (D-174)
      else if (spot.stop === 4) glideTo(VOID_STOP); // the supervoid, seen from the universe: back to it (D-130)
      else if (spot.stop === 3) glideTo(2); // the web, seen from the supervoid: back to the web (D-119)
      else glideTo(ZOOM_MIN); // the galaxy, seen from the web: back in close (D-112)
    };

    element.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      element.removeEventListener("click", onClick);
      document.removeEventListener("keydown", onKey);
    };
    // `back`, `glideTo` and `sync` only read the store and set state
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, spots]);

  return (
    <div ref={stage} className={styles.screen} data-live={live ? "" : undefined} data-moving={moving ? "" : undefined} data-start={phase !== "atlas" ? "" : undefined} data-web={level >= 2 ? "" : undefined} data-void={level === 3 ? "" : undefined} data-universe={level === 4 ? "" : undefined} data-heavens={level === 5 ? "" : undefined}>
      <SceneSlot id="atlas" mode="atlas" posters={POSTERS} opening={opening} />
      <StartScreen phase={phase} onBegin={begin} />

      <div className={styles.caption}>
        <div key={words.zoom} className={live ? styles.words : undefined}>
          <h1>{words.name}</h1>
          <p>{words.line}</p>
          {stop === 5 ? (
            <Link className={styles.more} href="/islam-and-space">
              Islam and Space
            </Link>
          ) : null}
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

      <DragHint live={live && stop !== 3} />
      {live ? (
        <div className={styles.controls}>
          <button type="button" className={styles.control} onClick={back} aria-disabled={level === 5}>
            <i className={styles.icon} aria-hidden="true">
              <ZoomOutIcon />
            </i>
            <span>Zoom Out</span>
          </button>
          <VideoButton video={words.video} name={words.name} />
        </div>
      ) : null}
    </div>
  );
}
