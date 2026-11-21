"use client";

import { useEffect, useRef, type RefObject } from "react";
import { flowBusy } from "@/scene/host/flow";

/*
  Drag, pinch and wheel on a scene screen (D-102), shared by the atlas and the places. One mouse,
  pen or finger turns (and with a mouse or pen also tilts); two fingers pinch to zoom; the wheel
  zooms. Nothing here scrolls the page. While a move between scenes is under way, input waits.
*/

export interface GestureHandlers {
  /** A drag, in CSS pixels since the last move. `touch` is true for a finger. */
  turn: (dx: number, dy: number, touch: boolean) => void;
  /** A pinch: the log2 of how much closer the fingers came (positive: pinched in, so further out). */
  pinch: (steps: number) => void;
  /** The wheel, in CSS pixels (positive: pulled toward the visitor, so further out). */
  wheel: (pixels: number) => void;
}

const DRAGGED_KEY = "cosmic-archive:dragged";
const draggedListeners = new Set<() => void>();

/** True once the visitor has dragged a scene, on this or an earlier visit: the hint has done its job. */
export function hasDragged(): boolean {
  try {
    return localStorage.getItem(DRAGGED_KEY) === "1";
  } catch {
    return false;
  }
}

export function subscribeDragged(listener: () => void): () => void {
  draggedListeners.add(listener);
  return () => {
    draggedListeners.delete(listener);
  };
}

function markDragged(): void {
  if (hasDragged()) return;
  try {
    localStorage.setItem(DRAGGED_KEY, "1");
  } catch {
    // storage blocked: the hint goes for this page view
  }
  draggedListeners.forEach((listener) => listener());
}

export function useGestures(target: RefObject<HTMLElement | null>, live: boolean, handlers: GestureHandlers): void {
  const ref = useRef(handlers);
  useEffect(() => {
    ref.current = handlers;
  });

  useEffect(() => {
    const element = target.current;
    if (!live || !element) return;

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return; // the browser's own zoom, and a trackpad pinch
      event.preventDefault();
      if (flowBusy()) return;
      ref.current.wheel(event.deltaMode === 1 ? event.deltaY * 32 : event.deltaY);
    };

    const pointers = new Map<number, { x: number; y: number; touch: boolean }>();
    let moved = 0;
    const spread = () => {
      const [a, b] = [...pointers.values()];
      return Math.hypot(a.x - b.x, a.y - b.y);
    };
    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || (event.target as Element).closest("a, button")) return;
      pointers.set(event.pointerId, { x: event.clientX, y: event.clientY, touch: event.pointerType === "touch" });
      element.setPointerCapture(event.pointerId);
      element.dataset.dragging = "";
      moved = 0;
    };
    const onMove = (event: PointerEvent) => {
      const last = pointers.get(event.pointerId);
      if (!last || flowBusy()) return;
      if (pointers.size >= 2) {
        const before = spread();
        last.x = event.clientX;
        last.y = event.clientY;
        const after = spread();
        if (before > 0 && after > 0) ref.current.pinch(Math.log2(before / after));
        return;
      }
      const dx = event.clientX - last.x;
      const dy = event.clientY - last.y;
      last.x = event.clientX;
      last.y = event.clientY;
      ref.current.turn(dx, dy, last.touch);
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 40) markDragged();
    };
    const onUp = (event: PointerEvent) => {
      if (!pointers.delete(event.pointerId)) return;
      if (pointers.size === 0) delete element.dataset.dragging;
    };

    element.addEventListener("wheel", onWheel, { passive: false });
    element.addEventListener("pointerdown", onDown);
    element.addEventListener("pointermove", onMove);
    element.addEventListener("pointerup", onUp);
    element.addEventListener("pointercancel", onUp);
    return () => {
      element.removeEventListener("wheel", onWheel);
      element.removeEventListener("pointerdown", onDown);
      element.removeEventListener("pointermove", onMove);
      element.removeEventListener("pointerup", onUp);
      element.removeEventListener("pointercancel", onUp);
      delete element.dataset.dragging;
    };
  }, [target, live]);
}
