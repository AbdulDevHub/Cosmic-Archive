/**
 * The three stages of the atlas on one zoom scalar: 0 hero, 1 chart, 2 cosmic web
 * (DESIGN_SPEC.md 7.2 to 7.4). The ranges are the approved prototype's.
 */

import { sstep } from "@/lib/math";

/**
 * Scroll progress through the track (0 to 1) to zoom. The view rests on each stage for a while,
 * so a stage can be read before the next pull-back begins.
 */
export function scrollZoom(p: number): number {
  if (p < 0.08) return 0;
  if (p < 0.38) return (p - 0.08) / 0.3;
  if (p < 0.52) return 1;
  if (p < 0.9) return 1 + (p - 0.52) / 0.38;
  return 2;
}

/** How visible each stage's words and beacons are at a zoom: hero, chart, web. */
export function stageOpacity(zoom: number): [number, number, number] {
  return [1 - sstep(0.12, 0.45, zoom), sstep(0.62, 0.9, zoom) * (1 - sstep(1.12, 1.38, zoom)), sstep(1.72, 1.95, zoom)];
}

const last = new WeakMap<HTMLElement, number>();

/** Sets an element's opacity, and takes it out of the tab order and away from pointers once it is gone. */
export function fade(element: HTMLElement | null, opacity: number): void {
  if (!element) return;
  const value = Math.round(opacity * 200) / 200;
  if (last.get(element) === value) return;
  last.set(element, value);
  element.style.opacity = String(value);
  element.style.visibility = value > 0.02 ? "visible" : "hidden";
}

/** Hands an element back to its stylesheet. */
export function unfade(element: HTMLElement | null): void {
  if (!element) return;
  last.delete(element);
  element.style.opacity = "";
  element.style.visibility = "";
}
