/**
 * Where a beacon's label goes. Pure geometry, no DOM.
 *
 * A label hangs off its beacon on a leader line. Each beacon has a preferred offset (the approved
 * prototype's composition); the candidates are that offset turned in steps and made a little
 * longer or shorter. The cheapest candidate wins: one that stays on screen, off the bright parts
 * of the scenery, clear of the page's copy and of other labels, and close to the preferred one.
 * The current choice gets a small discount, so a label does not flicker between two near-equal
 * places as the disc turns (DESIGN_SPEC.md section 10: real collision avoidance).
 */

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Offset {
  dx: number;
  dy: number;
}

/** A candidate, as a turn (in steps of `STEP`) and a scale of the preferred offset. */
export interface Choice {
  turn: number;
  scale: number;
}

export interface LabelRequest {
  /** The beacon, in viewport pixels. */
  x: number;
  y: number;
  /** The label's box. */
  w: number;
  h: number;
  /** The preferred offset of the leader's end, in pixels. */
  prefer: Offset;
  /** A short leader only ever points along an axis: it turns in quarter turns, not eighths. */
  square: boolean;
  current: Choice | null;
}

export interface LabelContext {
  bounds: Rect;
  /** Places a label must not cover: the page's copy, other labels, other beacons. */
  obstacles: readonly Rect[];
  /** Brightness of the scenery under a viewport point, 0 to 1. */
  shade: (x: number, y: number) => number;
}

export const STEP = Math.PI / 8;
const TURNS = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5, 6, -6, 7, -7, 8];
const SQUARE_TURNS = [0, 8, 4, -4];
const SCALES = [1, 1.3, 0.75];
/**
 * What leaving the preferred place costs. Set against the weight of the scenery (120 for a label
 * wholly on full brightness), a label holds its designed place over dim scenery and leaves it
 * for an arm. Both are more than `STAY`, so a label always returns when its place is free.
 */
const PER_TURN = 12;
const PER_SCALE = 12;
/** The discount for staying put, so a label does not flicker between two near-equal places. */
const STAY = 6;
/** The label's first line is centred on the leader's end: its box starts this far above it. */
export const FIRST_LINE = 8;
const MIN_LEADER = 26;
const SLACK = 4;

export function offsetOf(prefer: Offset, turn: number, scale: number): Offset {
  const a = turn * STEP;
  const c = Math.cos(a);
  const s = Math.sin(a);
  let dx = (prefer.dx * c - prefer.dy * s) * scale;
  let dy = (prefer.dx * s + prefer.dy * c) * scale;
  const length = Math.hypot(dx, dy);
  if (length > 0 && length < MIN_LEADER) {
    dx *= MIN_LEADER / length;
    dy *= MIN_LEADER / length;
  }
  return { dx, dy };
}

/** The box of a label whose leader ends at `offset` from the beacon. It grows away from the beacon. */
export function labelRect(x: number, y: number, offset: Offset, w: number, h: number): Rect {
  return { x: offset.dx < 0 ? x + offset.dx - w : x + offset.dx, y: y + offset.dy - FIRST_LINE, w, h };
}

function overlap(a: Rect, b: Rect): number {
  const w = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x);
  const h = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y);
  return w > 0 && h > 0 ? w * h : 0;
}

function outside(box: Rect, bounds: Rect): number {
  return (
    Math.max(0, bounds.x - box.x) +
    Math.max(0, box.x + box.w - (bounds.x + bounds.w)) +
    Math.max(0, bounds.y - box.y) +
    Math.max(0, box.y + box.h - (bounds.y + bounds.h))
  );
}

function cost(request: LabelRequest, context: LabelContext, turn: number, scale: number): number {
  const offset = offsetOf(request.prefer, turn, scale);
  const box = labelRect(request.x, request.y, offset, request.w, request.h);
  // a short leader has only four places, and the far side is no worse a place than above or below
  const turned = request.square ? Math.min(Math.abs(turn), 4) : Math.abs(turn);
  let total = turned * PER_TURN + (scale === 1 ? 0 : PER_SCALE);
  total += outside(box, context.bounds) * 4;

  let bright = 0;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) bright += context.shade(box.x + (box.w * (i + 0.5)) / 3, box.y + (box.h * (j + 0.5)) / 3);
  }
  total += (bright / 9) * 120;

  // a label's box has a few pixels of air around its letters: touching is not covering
  const inner = { x: box.x + SLACK, y: box.y + SLACK, w: box.w - 2 * SLACK, h: box.h - 2 * SLACK };
  const area = Math.max(1, inner.w * inner.h);
  for (const obstacle of context.obstacles) {
    const covered = overlap(inner, obstacle);
    if (covered > 0) total += 80 + (300 * covered) / area;
  }

  if (request.current && request.current.turn === turn && request.current.scale === scale) total -= STAY;
  return total;
}

export function chooseLabel(request: LabelRequest, context: LabelContext): Choice {
  let best = { turn: 0, scale: 1 };
  let lowest = Infinity;
  for (const turn of request.square ? SQUARE_TURNS : TURNS) {
    for (const scale of SCALES) {
      const value = cost(request, context, turn, scale);
      if (value < lowest) {
        lowest = value;
        best = { turn, scale };
      }
    }
  }
  return best;
}

/** A label to draw: where its beacon is now, its size, and where it would like to hang. */
export type Placed = Pick<LabelRequest, "x" | "y" | "w" | "h" | "prefer">;

/**
 * The offset to draw for a choice. If the place leaves the screen, the label slides back in and
 * the leader follows it, never flipping the label's side. Worked out on every frame, not only when
 * the place is chosen: a zoom moves the beacon and stretches the leader between two layouts.
 */
export function resolve(label: Placed, choice: Choice, bounds: Rect): Offset {
  const offset = offsetOf(label.prefer, choice.turn, choice.scale);
  const box = labelRect(label.x, label.y, offset, label.w, label.h);
  const nudgeX = Math.max(0, bounds.x - box.x) - Math.max(0, box.x + box.w - (bounds.x + bounds.w));
  const nudgeY = Math.max(0, bounds.y - box.y) - Math.max(0, box.y + box.h - (bounds.y + bounds.h));
  const dx = offset.dx + nudgeX;
  return { dx: offset.dx < 0 ? Math.min(-1, dx) : Math.max(1, dx), dy: offset.dy + nudgeY };
}
