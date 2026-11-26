"use client";

/**
 * The one persistent canvas (ARCHITECTURE.md 3.1, D-015). Loaded by SceneHostLoader only
 * after a page asks for a scene; it then stays for the whole visit, so there is one WebGL
 * context and no context churn between routes.
 *
 * It uses React Three Fiber's createRoot rather than <Canvas>: <Canvas> registers every three
 * class, which defeats tree-shaking. Scenes add their objects as <primitive>, so nothing needs
 * registering.
 */

import { createRoot, useFrame, type ReconcilerRoot } from "@react-three/fiber";
import { lazy, Suspense, useEffect, useRef, useState, useSyncExternalStore, type ComponentType } from "react";
import { Color } from "three";
import { getMotion, getServerMotion, subscribeMotion } from "@/lib/motion";
import { Governor } from "../quality/governor";
import { pixelRatio, RUNG_MEDIUM, RUNGS } from "../quality/tiers";
import styles from "./SceneHost.module.css";
import { sceneParams, START_TIME } from "./params";
import { SCENES } from "./registry";
import {
  endSceneTween,
  getSceneInput,
  getSceneTweens,
  markReady,
  onSceneInput,
  publishSceneFrame,
  setQuality,
  setStatus,
  useSceneState,
  type SceneId,
  type SceneInput,
  type SceneNumber,
  type SlotRequest,
} from "./store";
import type { Box, SceneProps } from "./types";

const BACKGROUND = new Color(0x090a1c); // --space

const LAZY = Object.fromEntries(
  Object.entries(SCENES).map(([id, load]) => [id, lazy(load)]),
) as unknown as Record<SceneId, ComponentType<SceneProps>>;

function subscribeVisibility(listener: () => void): () => void {
  document.addEventListener("visibilitychange", listener);
  return () => document.removeEventListener("visibilitychange", listener);
}
const isPageVisible = () => document.visibilityState === "visible";

interface Size {
  width: number;
  height: number;
}

/**
 * One renderer root per canvas, and its unmount put off a moment. React's Strict Mode (dev only)
 * mounts, unmounts and mounts again at once; R3F tears an unmounted root down 500 ms later and
 * hands the dying root back to a second createRoot on the same canvas, so the scene never drew in
 * `next dev`. The second mount now cancels the unmount and reuses the root.
 */
const roots = new WeakMap<HTMLCanvasElement, ReconcilerRoot<HTMLCanvasElement>>();
const unmounting = new WeakMap<HTMLCanvasElement, ReturnType<typeof setTimeout>>();

function rootFor(canvas: HTMLCanvasElement): ReconcilerRoot<HTMLCanvasElement> {
  clearTimeout(unmounting.get(canvas));
  unmounting.delete(canvas);
  let root = roots.get(canvas);
  if (!root) {
    root = createRoot(canvas);
    roots.set(canvas, root);
  }
  return root;
}

function releaseRoot(canvas: HTMLCanvasElement): void {
  unmounting.set(
    canvas,
    setTimeout(() => {
      unmounting.delete(canvas);
      roots.get(canvas)?.unmount();
      roots.delete(canvas);
    }, 0),
  );
}

export default function SceneHost() {
  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [root, setRoot] = useState<ReconcilerRoot<HTMLCanvasElement> | null>(null);
  const [size, setSize] = useState<Size | null>(null);
  const invalidateRef = useRef<(() => void) | null>(null);

  const mounted = useSceneState((s) => s.mounted);
  const slotPresent = useSceneState((s) => s.slot !== null);
  const slotVisible = useSceneState((s) => s.slotVisible);
  const quality = useSceneState((s) => s.quality);
  const ready = useSceneState((s) => s.slot !== null && s.readyToken === s.slot.token);
  const lost = useSceneState((s) => s.status === "lost");
  const motion = useSyncExternalStore(subscribeMotion, getMotion, getServerMotion);
  const pageVisible = useSyncExternalStore(subscribeVisibility, isPageVisible, () => true);

  const [params] = useState(sceneParams);
  const timeRef = useRef(params.time ?? START_TIME);
  const viewRef = useRef<SceneInput>({ zoom: 0, yaw: 0, pitch: 0, focus: null, dive: 0, arrive: 1, intro: 0 });
  const runningRef = useRef(false);

  const rung = typeof quality === "number" ? quality : RUNG_MEDIUM;
  const [governor] = useState(() => new Governor(rung, (next) => setQuality(next)));

  // The loop runs only while a scene is on screen, the tab is visible and motion is on (3.6).
  const isRunning = mounted !== null && slotPresent && slotVisible && pageVisible && motion === "on" && !params.shot && !lost;

  useEffect(() => {
    runningRef.current = isRunning;
    if (isRunning) governor.restart(rung, performance.now());
  }, [isRunning, governor, rung]);

  // While the loop is stopped (reduced motion), a drag or a key still has to draw its frame.
  useEffect(() => onSceneInput(() => invalidateRef.current?.()), []);

  // Create the renderer root once per visit.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const created = rootFor(canvas);
    let losses = 0;
    const onLost = (event: Event) => {
      event.preventDefault();
      losses += 1;
      setStatus("lost"); // the poster shows through while the canvas is hidden
      if (losses > 1) setQuality("static"); // one restore attempt only (3.2)
    };
    const onRestored = () => {
      setStatus("ok");
      invalidateRef.current?.(); // with no loop running (reduced motion) nothing else redraws the lost buffer
    };
    canvas.addEventListener("webglcontextlost", onLost);
    canvas.addEventListener("webglcontextrestored", onRestored);
    const observer = new ResizeObserver(() => {
      const width = stage.clientWidth;
      const height = stage.clientHeight;
      setSize((current) => (current && current.width === width && current.height === height ? current : { width, height }));
      setRoot((current) => current ?? created);
    });
    observer.observe(stage);
    return () => {
      observer.disconnect();
      canvas.removeEventListener("webglcontextlost", onLost);
      canvas.removeEventListener("webglcontextrestored", onRestored);
      releaseRoot(canvas);
    };
  }, []);

  const dpr = size ? pixelRatio(RUNGS[rung], size.width, size.height, window.devicePixelRatio) : 1;

  useEffect(() => {
    if (!root || !size) return;
    void root.configure({
      gl: {
        antialias: true,
        alpha: false,
        powerPreference: "high-performance",
        preserveDrawingBuffer: params.shot, // posters read the canvas back
      },
      camera: { fov: 38, near: 0.05, far: 30000, manual: true },
      scene: { background: BACKGROUND },
      flat: true,
      size: { width: size.width, height: size.height, top: 0, left: 0 },
      dpr,
      frameloop: isRunning ? "always" : mounted ? "demand" : "never",
    });
    // Keyed by token: a page that asks for another scene gets a fresh one, which reports its own first frame;
    // the same scene, already drawn, is kept (D-213, `requestScene`).
    const store = root.render(
      mounted ? (
        <SceneTree
          key={mounted.token}
          slot={mounted}
          rung={rung}
          timeRef={timeRef}
          viewRef={viewRef}
          runningRef={runningRef}
          fixedZoom={params.zoom}
          governor={params.tier === null ? governor : null}
        />
      ) : null,
    );
    // `configure` is async: until it has made the renderer (or after the root is gone) there is
    // nothing to redraw, and R3F's invalidate would read `gl.xr` off null. The first frame draws anyway.
    invalidateRef.current = () => {
      const state = store.getState();
      if (state.gl) state.invalidate();
    };
  }, [root, size, dpr, isRunning, mounted, rung, governor, params.shot, params.tier, params.zoom]);

  // Once a scene is on screen, fetch the others while the browser is idle: the next one is then
  // already here when the visitor clicks, and the flow between scenes does not wait (D-096).
  useEffect(() => {
    if (!ready) return;
    const fetchAll = () => Object.values(SCENES).forEach((load) => void load());
    if ("requestIdleCallback" in window) {
      const id = requestIdleCallback(fetchAll, { timeout: 4000 });
      return () => cancelIdleCallback(id);
    }
    const id = setTimeout(fetchAll, 1500);
    return () => clearTimeout(id);
  }, [ready]);

  const on = ready && !lost;
  return (
    <div
      ref={stageRef}
      className={`${styles.stage} ${params.shot ? styles.instant : ""}`}
      data-on={on ? "" : undefined}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className={styles.canvas} />
    </div>
  );
}

interface SceneTreeProps {
  slot: SlotRequest;
  rung: number;
  timeRef: Box<number>;
  viewRef: Box<SceneInput>;
  runningRef: Box<boolean>;
  /** From `?zoom=`: holds the zoom there for stills. */
  fixedZoom: number | null;
  /** Null when `?tier=` pins the quality. */
  governor: Governor | null;
}

function SceneTree({ slot, rung, timeRef, viewRef, runningRef, fixedZoom, governor }: SceneTreeProps) {
  const Scene = LAZY[slot.id];
  return (
    <>
      <Clock timeRef={timeRef} viewRef={viewRef} runningRef={runningRef} fixedZoom={fixedZoom} governor={governor} />
      <Suspense fallback={null}>
        <Scene mode={slot.mode} rung={rung} time={timeRef} view={viewRef} publish={publishSceneFrame} onReady={() => markReady(slot.token)} />
      </Suspense>
    </>
  );
}

const EASE_PER_SECOND = 5; // the prototype's: the camera closes a fifth of the gap every 40 ms
const NUMBERS: readonly SceneNumber[] = ["zoom", "yaw", "pitch", "dive", "arrive", "intro"];
const easeInOut = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2);

/**
 * Advances scene time while the loop runs, moves the camera toward what the visitor asked for,
 * and feeds the governor. Mounted before the scene, so it ticks first.
 *
 * While the loop runs the camera eases: a click's glide over its set time, eased in and out (D-097),
 * anything else (wheel, drag, keys) by closing part of the gap each frame. While it is stopped
 * (reduced motion, a still for a screenshot) there is no gliding: each view is one frame.
 */
function Clock({ timeRef, viewRef, runningRef, fixedZoom, governor }: Omit<SceneTreeProps, "slot" | "rung">) {
  const started = useRef(false);
  useFrame((_, delta) => {
    const target = getSceneInput();
    const tweens = getSceneTweens();
    const view = viewRef.current;
    const running = runningRef.current;
    const dt = Math.min(delta, 0.05);
    const now = performance.now();
    view.focus = target.focus;
    for (const key of NUMBERS) {
      const tween = tweens.get(key);
      if (!running || !started.current) {
        view[key] = key === "zoom" && !running ? Math.round(target.zoom) : target[key];
        if (tween) endSceneTween(key);
      } else if (tween) {
        if (tween.from === null) {
          tween.from = view[key];
          tween.start = now;
        }
        const p = Math.min(1, (now - tween.start) / tween.ms);
        view[key] = tween.from + (tween.to - tween.from) * easeInOut(p);
        if (p >= 1) endSceneTween(key);
      } else {
        view[key] += (target[key] - view[key]) * Math.min(1, dt * EASE_PER_SECOND);
      }
    }
    if (fixedZoom !== null) view.zoom = fixedZoom;
    const held = sceneParams();
    if (held.dive !== null && held.focus) {
      view.dive = held.dive;
      view.focus = held.focus;
    }
    started.current = true;
    if (!running) return;
    timeRef.current += dt;
    governor?.sample(delta * 1000, performance.now());
  });
  return null;
}
