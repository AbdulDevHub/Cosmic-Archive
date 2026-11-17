export const clamp = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

/** 0 below `a`, 1 above `b`, a smooth S-curve between. */
export function sstep(a: number, b: number, x: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
