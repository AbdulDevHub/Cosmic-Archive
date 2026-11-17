import type { SceneFrame, SceneInput, SceneMode } from "./store";

/** A mutable box the host writes and scenes read every frame, without re-rendering React. */
export interface Box<T> {
  current: T;
}

/** What every scene component receives from the host. */
export interface SceneProps {
  mode: SceneMode;
  /** Index into RUNGS. */
  rung: number;
  /** Scene time in seconds. Scenes never read a clock (ARCHITECTURE.md 3.3). */
  time: Box<number>;
  /** Where the camera is now: the visitor's input, eased by the host. Zoom is 0 hero, 1 chart, 2 cosmic web. */
  view: Box<SceneInput>;
  /** Hands the DOM what it needs to draw over this frame. Call it after drawing. */
  publish: (frame: SceneFrame) => void;
  /** Called once the first frame has been drawn. */
  onReady: () => void;
}

/** What every scene module exports, next to its default component. */
export interface SceneBudget {
  drawCalls: number;
  particles: Record<"low" | "medium" | "high", number>;
}
