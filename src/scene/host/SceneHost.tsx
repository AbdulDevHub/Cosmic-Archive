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
  markReady,
  setQuality,
  setStatus,
  useSceneState,
  type SceneId,
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
  const zoomRef = useRef(0);
  const runningRef = useRef(false);

  const rung = typeof quality === "number" ? quality : RUNG_MEDIUM;
  const [governor] = useState(() => new Governor(rung, (next) => setQuality(next)));

  // The loop runs only while a scene is on screen, the tab is visible and motion is on (3.6).
  const isRunning = mounted !== null && slotPresent && slotVisible && pageVisible && motion === "on" && !params.shot && !lost;

  useEffect(() => {
    runningRef.current = isRunning;
    if (isRunning) governor.restart(rung, performance.now());
  }, [isRunning, governor, rung]);

  // Create the renderer root once per visit.
  useEffect(() => {
    const stage = stageRef.current;
    const canvas = canvasRef.current;
    if (!stage || !canvas) return;
    const created = createRoot(canvas);
    let losses = 0;
    const onLost = (event: Event) => {
      event.preventDefault();
      losses += 1;
      setStatus("lost"); // the poster shows through while the canvas is hidden
      if (losses > 1) setQuality("static"); // one restore attempt only (3.2)
    };
    const onRestored = () => {
      setStatus("ok");
      invalidateRef.current?.(); // with no loop running (reduced motion, Pause) nothing else redraws the lost buffer
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
      created.unmount();
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
    // Keyed by token: a page that asks again gets a fresh scene, which reports its own first frame.
    const store = root.render(
      mounted ? (
        <SceneTree key={mounted.token} slot={mounted} rung={rung} timeRef={timeRef} zoomRef={zoomRef} runningRef={runningRef} governor={params.tier === null ? governor : null} />
      ) : null,
    );
    invalidateRef.current = () => store.getState().invalidate();
  }, [root, size, dpr, isRunning, mounted, rung, governor, params.shot, params.tier]);

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
  zoomRef: Box<number>;
  runningRef: Box<boolean>;
  /** Null when `?tier=` pins the quality. */
  governor: Governor | null;
}

function SceneTree({ slot, rung, timeRef, zoomRef, runningRef, governor }: SceneTreeProps) {
  const Scene = LAZY[slot.id];
  return (
    <>
      <Clock timeRef={timeRef} runningRef={runningRef} governor={governor} />
      <Suspense fallback={null}>
        <Scene mode={slot.mode} rung={rung} time={timeRef} zoom={zoomRef} onReady={() => markReady(slot.token)} />
      </Suspense>
    </>
  );
}

/** Advances scene time while the loop runs and feeds the governor. Mounted before the scene, so it ticks first. */
function Clock({ timeRef, runningRef, governor }: { timeRef: Box<number>; runningRef: Box<boolean>; governor: Governor | null }) {
  useFrame((_, delta) => {
    if (!runningRef.current) return;
    timeRef.current += Math.min(delta, 0.05);
    governor?.sample(delta * 1000, performance.now());
  });
  return null;
}
