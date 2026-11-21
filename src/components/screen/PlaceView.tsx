"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { flowBusy, pullOut } from "@/scene/host/flow";
import { SceneSlot } from "@/scene/host/SceneSlot";
import { getSceneInput, sceneIsLive, setSceneInput, useSceneState, type SceneId } from "@/scene/host/store";
import { ReturnIcon } from "../icons";
import { DragHint } from "./DragHint";
import styles from "./screen.module.css";
import { useGestures } from "./useGestures";

/*
  One place (DESIGN_SPEC.md 7, D-092): its scene fills the window, with its name and one line.

  It opens all the way in, the place as large as it gets (D-112). The wheel and a pinch zoom out to
  its own framing and back; a drag turns around it (the black hole and the quasar) or pans across
  it (the nebula). Return, the one button (D-115), shrinks it away and returns to the atlas, dived into
  the place's light, which then pulls back to where it was found (the flow, D-096). Escape does
  the same, and so does pulling the wheel on past the framing.

  Without the scene it is the poster, the same words, and "Return" as a plain link home.
*/

export interface PlaceWords {
  name: string;
  line: string;
  scene: SceneId;
  anchor: string;
  stop: number;
  /** Where "Further" goes at the framing: the atlas. */
  outTo: string;
}

const ATLAS_VEIL = "#090a1c"; // --space: the atlas's own darkness
const WHEEL_ZOOM = 0.0012; // as on the atlas: one notch is about an eighth of the way
const WHEEL_OUT = 260; // pixels of wheel pulled on past the framing before the place is left
const WHEEL_GAP = 350; // ms of no wheel after zooming out to the framing before a pull can leave
const PINCH_ZOOM = 1.1;
const DRAG = 0.005; // radians per pixel
const KEY_ZOOM = 0.25;
const KEY_TURN = 0.15;
/** Zoom on a place: 0 all the way closer, 1 its own framing. */
const FRAMED = 1;

export function PlaceView({ place }: { place: PlaceWords }) {
  const stage = useRef<HTMLDivElement>(null);
  const live = useSceneState(sceneIsLive);
  const router = useRouter();
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);
  const posters = { wide: `/posters/${place.scene}-wide.webp`, narrow: `/posters/${place.scene}-narrow.webp` };

  const leave = () => {
    if (flowBusy()) return;
    // back to the view the place is seen from: the web for the quasar, close in for the rest (D-112)
    pullOut((href) => routerRef.current.push(href), place.outTo, place.anchor, place.stop === 2 ? 2 : 0, ATLAS_VEIL);
  };
  const zoomTo = (zoom: number) => {
    if (flowBusy()) return;
    setSceneInput({ zoom: Math.min(FRAMED, Math.max(0, zoom)) });
  };
  /** Further leaves the place at once (D-112): the button moves between scenes; the wheel zooms. */
  const further = leave;
  const actions = useRef({ zoomTo });
  useEffect(() => {
    actions.current = { zoomTo };
  });

  // Drag turns or pans, the wheel and a pinch zoom; pulled on past the framing, the wheel leaves.
  // `zoomed` is when the wheel last moved the zoom: a pull past the framing counts only as a fresh
  // gesture after a pause, so a trackpad's momentum from zooming out never leaves the place by itself
  const pulled = useRef({ pixels: 0, rest: 0 as ReturnType<typeof setTimeout> | 0, zoomed: 0 });
  useGestures(stage, live, {
    turn: (dx, dy) => {
      const { yaw, pitch } = getSceneInput();
      setSceneInput({ yaw: yaw - dx * DRAG, pitch: pitch + dy * DRAG });
    },
    pinch: (steps) => actions.current.zoomTo(getSceneInput().zoom + steps * PINCH_ZOOM * 0.5),
    wheel: (pixels) => {
      const { zoom } = getSceneInput();
      const now = performance.now();
      if (zoom < FRAMED - 0.001 || pixels < 0) {
        pulled.current.pixels = 0;
        pulled.current.zoomed = now;
        actions.current.zoomTo(zoom + pixels * WHEEL_ZOOM);
        return;
      }
      if (now - pulled.current.zoomed < WHEEL_GAP) {
        pulled.current.zoomed = now; // still the same gesture: keep waiting for a pause
        return;
      }
      const p = pulled.current;
      p.pixels += pixels;
      if (p.rest) clearTimeout(p.rest);
      p.rest = setTimeout(() => (p.pixels = 0), 400); // a pause in the wheel starts the count again
      if (p.pixels > WHEEL_OUT) {
        p.pixels = 0;
        leave();
      }
    },
  });

  // Keys: + and − zoom (− at the framing leaves), the arrows turn, Escape leaves.
  useEffect(() => {
    if (!live) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey || event.altKey || flowBusy()) return;
      const { zoom, yaw, pitch } = getSceneInput();
      if (event.key === "Escape") leave();
      else if (event.key === "+" || event.key === "=") actions.current.zoomTo(zoom - KEY_ZOOM);
      else if (event.key === "-" || event.key === "_") {
        if (zoom >= FRAMED - 0.01) leave();
        else actions.current.zoomTo(zoom + KEY_ZOOM);
      } else if (event.key === "ArrowLeft") setSceneInput({ yaw: yaw - KEY_TURN });
      else if (event.key === "ArrowRight") setSceneInput({ yaw: yaw + KEY_TURN });
      else if (event.key === "ArrowUp") setSceneInput({ pitch: pitch - KEY_TURN * 0.5 });
      else if (event.key === "ArrowDown") setSceneInput({ pitch: pitch + KEY_TURN * 0.5 });
      else return;
      event.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // `leave` reads only refs and the store
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  return (
    <div ref={stage} className={styles.screen} data-live={live ? "" : undefined}>
      <SceneSlot id={place.scene} mode="place" posters={posters} />
      <div className={styles.caption}>
        <h1>{place.name}</h1>
        <p>{place.line}</p>
      </div>
      <DragHint live={live} />
      <div className={styles.controls}>
        <a
          className={styles.control}
          href={place.outTo}
          onClick={(event) => {
            if (!live || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
            event.preventDefault();
            further();
          }}
        >
          <i className={styles.icon} aria-hidden="true">
            <ReturnIcon />
          </i>
          <span>Return</span>
        </a>
      </div>
    </div>
  );
}
