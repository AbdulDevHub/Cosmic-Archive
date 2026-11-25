"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { setMusic } from "@/lib/sound";
import { dropHintOnLeave, markVisited, useHint } from "@/lib/progress";
import { readVia, setVia } from "@/lib/via";
import { diveInto, flowBusy, pullOut } from "@/scene/host/flow";
import { SceneSlot } from "@/scene/host/SceneSlot";
import { getSceneFrame, getSceneInput, sceneIsLive, setSceneInput, subscribeSceneFrame, useSceneState, type SceneFrame, type SceneId } from "@/scene/host/store";
import { ZoomOutIcon } from "../icons";
import { VideoButton } from "./VideoButton";
import { DragHint } from "./DragHint";
import styles from "./screen.module.css";
import { useGestures } from "./useGestures";

/*
  One place (DESIGN_SPEC.md 7, D-092): its scene fills the window, with its name and one line.

  It opens all the way in, the place as large as it gets (D-112). The wheel and a pinch zoom out to
  its own framing and back; a drag turns around it (the black hole and the quasar) or pans across
  it (the nebula). Zoom Out, the one button (D-115, D-116), shrinks it away and returns to the atlas, dived into
  the place's light, which then pulls back to where it was found (the flow, D-096). Escape does
  the same, and so does pulling the wheel on past the framing.

  Without the scene it is the poster, the same words, and "Zoom Out" as a plain link home.

  Places inside places (D-132): a place may hold others (the solar system its star and planet, the
  planet its moon). Their hotspots stand on the bodies the scene names; a click dives into the body
  and opens its page, and that page's Zoom Out comes back here, as the atlas's places do.
*/

export interface PlaceWords {
  name: string;
  line: string;
  /** A video about it on YouTube (D-141). */
  video?: string;
  scene: SceneId;
  anchor: string;
  /** Where Zoom Out goes: the atlas, or the place this one is inside (D-132). */
  outTo: string;
  /** The zoom it opens there at: the atlas stop it was found at, or that place's framing. */
  outZoom: number;
  /** The darkness of the scene Zoom Out goes back to. */
  outVeil: string;
  /** Another place that leads here (D-133): arrived through it, Zoom Out goes back through it. */
  through?: { from: string; outTo: string; outZoom: number; outVeil: string; anchor: string };
}

/** A place inside this one (D-132): its hotspot stands on the scene's body `anchor`. */
export interface InnerSpot {
  id: string;
  name: string;
  href: string;
  anchor: string;
  veil: string;
}

const WHEEL_ZOOM = 0.0012; // as on the atlas: one notch is about an eighth of the way
const WHEEL_OUT = 260; // pixels of wheel pulled on past the framing before the place is left
const WHEEL_GAP = 350; // ms of no wheel after zooming out to the framing before a pull can leave
const PINCH_ZOOM = 1.1;
const DRAG = 0.005; // radians per pixel
const KEY_ZOOM = 0.25;
const KEY_TURN = 0.15;
/** Zoom on a place: 0 all the way closer, 1 its own framing. */
const FRAMED = 1;

export function PlaceView({ place, inner = [] }: { place: PlaceWords; inner?: readonly InnerSpot[] }) {
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
    // back to the view the place is seen from: the web for the quasar, close in for the rest (D-112),
    // or the place it is inside, framed (D-132), or back through the place it came by (D-133)
    const back = place.through && readVia(place.scene) === place.through.from ? place.through : { ...place, anchor: place.anchor };
    pullOut((href) => routerRef.current.push(href), back.outTo, back.anchor, back.outZoom, back.outVeil);
  };
  const zoomTo = (zoom: number) => {
    if (flowBusy()) return;
    setSceneInput({ zoom: Math.min(FRAMED, Math.max(0, zoom)) });
  };
  /** Further leaves the place at once (D-112): the button moves between scenes; the wheel zooms. */
  const further = leave;
  // each place has its own music (D-116)
  useEffect(() => setMusic(place.scene), [place.scene]);
  // D-206: found for good; its name unlocks in the Places menu
  useEffect(() => markVisited(place.scene), [place.scene]);
  const hint = useHint();
  // a hint shown here is done once the visitor leaves this place without taking it (`dropHintOnLeave`)
  useEffect(() => dropHintOnLeave(inner.map((spot) => spot.id)), [inner]);
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

  // The places inside this one: each frame, stood on its body; a click dives into it (D-132).
  const spotList = useRef<HTMLUListElement>(null);
  useEffect(() => {
    if (!live || inner.length === 0) return;
    const items = [...(spotList.current?.querySelectorAll<HTMLElement>("[data-anchor]") ?? [])];
    const apply = (frame: SceneFrame) => {
      const busy = flowBusy();
      for (const item of items) {
        const point = frame.points[item.dataset.anchor ?? ""];
        const inside = point && point.on && point.x > 8 && point.y > 8 && point.x < frame.width - 8 && point.y < frame.height - 8;
        if (!busy && inside) {
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
    const onClick = (event: MouseEvent) => {
      const item = (event.target as Element).closest<HTMLElement>("[data-anchor]");
      if (!item || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      const spot = inner.find((entry) => entry.anchor === item.dataset.anchor);
      if (!spot) return;
      event.preventDefault();
      if (flowBusy()) return;
      setVia(spot.id, place.scene);
      diveInto((href) => routerRef.current.push(href), spot.href, spot.anchor, spot.veil);
    };
    const list = spotList.current;
    list?.addEventListener("click", onClick);
    return () => {
      unsubscribe();
      list?.removeEventListener("click", onClick);
      for (const item of items) {
        delete item.dataset.hidden;
        item.style.transform = "";
        item.removeAttribute("tabindex");
      }
    };
    // `place.scene` is fixed for the page
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, inner]);

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
        {inner.length > 0 ? (
          <ul ref={spotList} className={styles.spots} data-live={live ? "" : undefined} aria-label="Places">
            {inner.map((spot) => (
              <li key={spot.id}>
                <a className={styles.spot} href={spot.href} data-anchor={spot.anchor} data-hint={hint === spot.id ? "" : undefined}>
                  <i className={styles.mark} aria-hidden="true" />
                  <span className={styles.name}>{spot.name}</span>
                </a>
              </li>
            ))}
          </ul>
        ) : null}
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
            <ZoomOutIcon />
          </i>
          <span>Zoom Out</span>
        </a>
        <VideoButton video={place.video} name={place.name} />
      </div>
    </div>
  );
}
