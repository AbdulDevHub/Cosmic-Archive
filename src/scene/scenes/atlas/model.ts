/**
 * The atlas's particle data, ported from the F1 prototype (removed in D-135; in git history) as it is (ARCHITECTURE.md 4).
 * Pure arrays, no three. The seeded generator is consumed in the prototype's order, so at the
 * same counts the galaxy is the same instance the owner approved.
 *
 * Changes from the prototype, all from DESIGN_SPEC.md section 10 or the tier budgets:
 * - counts come from the tier (`COUNTS`) instead of a phone/desktop switch;
 * - the companion's four glow sprites are their own layer (they are drawn as quads);
 * - `buildBulge` is new: a small bright heart for the `low` tier, where the core looked dull;
 * - the web: the home galaxy sits on a thread instead of in a void, and the phone volume is
 *   smaller and denser (see `buildWebNodes` and `buildThreads`).
 */

import type { ParticleTier } from "../../quality/tiers";

// ---------- deterministic random ----------
export interface Rng {
  rand: () => number;
  gauss: () => number;
}

export function makeRng(seed = 20261111): Rng {
  let s = seed;
  const rand = () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const gauss = () => {
    const u = Math.max(rand(), 1e-9);
    const v = rand();
    return Math.sqrt(-2 * Math.log(u)) * Math.cos(6.2831853 * v);
  };
  return { rand, gauss };
}

export const TAU = Math.PI * 2;
export const mix = (a: number, b: number, t: number) => a + (b - a) * t;
export const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
export const sstep = (a: number, b: number, x: number) => {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

// ---------- palette (scenery only) ----------
export type RGB = readonly [number, number, number];
export const C = {
  white: [1.0, 0.96, 0.86],
  gold: [1.0, 0.78, 0.42],
  ember: [1.0, 0.46, 0.28],
  amber: [1.0, 0.6, 0.26],
  magenta: [1.0, 0.3, 0.72],
  young: [0.62, 0.8, 1.0],
  rose: [0.98, 0.34, 0.62],
  violet: [0.52, 0.4, 1.0],
  azure: [0.28, 0.62, 1.0],
  teal: [0.3, 0.86, 0.82],
  ink: [0.957, 0.933, 0.886],
} as const satisfies Record<string, RGB>;
const mixC = (a: RGB, b: RGB, t: number): RGB => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
const scaleC = (c: RGB, k: number): RGB => [c[0] * k, c[1] * k, c[2] * k];

// ---------- particle buffers ----------
export interface Cloud {
  pos: Float32Array;
  col: Float32Array;
  size: Float32Array;
  seed: Float32Array;
  n: number;
}

function alloc(n: number): Cloud {
  return { pos: new Float32Array(n * 3), col: new Float32Array(n * 3), size: new Float32Array(n), seed: new Float32Array(n), n: 0 };
}

function put(rng: Rng, d: Cloud, x: number, y: number, z: number, c: RGB, s: number): void {
  const i = d.n++;
  d.pos[i * 3] = x;
  d.pos[i * 3 + 1] = y;
  d.pos[i * 3 + 2] = z;
  d.col[i * 3] = c[0];
  d.col[i * 3 + 1] = c[1];
  d.col[i * 3 + 2] = c[2];
  d.size[i] = s;
  d.seed[i] = rng.rand();
}

// ---------- level 1: the galaxy ----------
export const SPIN = 0.018; // rigid pattern rotation, radians per second
export const WIND = 3.1;
export const R0 = 0.11; // log-spiral winding
const ARMS = [0, Math.PI, Math.PI * 0.5, Math.PI * 1.5];
const ARM_W = [0.33, 0.66, 0.83, 1.0];
export const armAngle = (arm: number, r: number) => ARMS[arm] + WIND * Math.log(r / R0);
export const GAL_R = 1.16;
export const RING = 1.2;
export const OUTER = 1.62;
// a dwarf companion between the two outer rings; it does not turn with the disc
export const SATELLITE: RGB = [1.42 * Math.cos(3.75), 0.08, 1.42 * Math.sin(3.75)];

export function discColor(t: number, knot: number): RGB {
  // t = radius 0..1 (S2, D-111): a white-gold heart, gold and amber far out into the disc, then
  // rose, violet and azure, a teal rim. The warm part is wider than the prototype's, as in the
  // references, and passes through amber rather than ember, so the middle reads gold, not salmon.
  let c =
    t < 0.1
      ? mixC(C.white, C.gold, t / 0.1)
      : t < 0.3
        ? mixC(C.gold, C.amber, (t - 0.1) / 0.2)
        : t < 0.48
          ? mixC(C.amber, C.rose, (t - 0.3) / 0.18)
          : t < 0.66
            ? mixC(C.rose, C.violet, (t - 0.48) / 0.18)
            : t < 0.88
              ? mixC(C.violet, C.azure, (t - 0.66) / 0.22)
              : mixC(C.azure, C.teal, clamp((t - 0.88) / 0.12, 0, 1));
  if (knot === 1) c = mixC(c, C.magenta, 0.75);
  if (knot === 2) c = mixC(c, [0.75, 0.88, 1.0], 0.8);
  if (knot === 3) c = mixC(c, C.teal, 0.8);
  return c;
}

// arms fade toward the rim instead of ending in a bright tip
export const taper = (rr: number) => mix(1.0, 0.4, sstep(0.7, 1.0, rr));

function buildGalaxy(rng: Rng, n: number): Cloud {
  const { rand, gauss } = rng;
  const knots = 340;
  const d = alloc(n + knots);
  for (let i = 0; i < n; i++) {
    if (rand() < 0.085) {
      // bulge
      const x = gauss() * 0.085;
      const z = gauss() * 0.085;
      const r = Math.hypot(x, z);
      const c = mixC(C.white, C.gold, clamp(r / 0.14, 0, 1));
      put(rng, d, x, gauss() * 0.032 * Math.exp(-r * 5), z, scaleC(c, 0.3), 0.7 + rand() * 1.2);
      continue;
    }
    const r = 0.1 - Math.log(1 - rand() * 0.93) * 0.4; // exponential disc
    let x: number;
    let z: number;
    let dim = 1;
    if (rand() < 0.74) {
      // on an arm
      const a = rand();
      const arm = a < ARM_W[0] ? 0 : a < ARM_W[1] ? 1 : a < ARM_W[2] ? 2 : 3;
      let th = armAngle(arm, r);
      const sig = (arm > 1 ? 0.02 : 0.027) + 0.065 * r;
      if (rand() < 0.24) {
        th -= Math.abs(gauss()) * 0.24; // feathers and spurs trailing off the arm
        dim = 0.62;
      }
      x = r * Math.cos(th) + gauss() * sig;
      z = r * Math.sin(th) + gauss() * sig;
      if (arm > 1) dim *= 0.75;
    } else {
      // the old disc between the arms: this is what makes it a full island of stars
      const th = rand() * TAU;
      x = r * Math.cos(th);
      z = r * Math.sin(th);
      dim = 0.5;
    }
    const k = rand();
    const knot = k < 0.04 ? 1 : k < 0.1 ? 2 : k < 0.125 ? 3 : 0;
    const rr = Math.hypot(x, z) / GAL_R;
    let c = discColor(rr + gauss() * 0.045, knot);
    if (dim <= 0.5) c = rr < 0.4 ? mixC(c, C.gold, 0.32) : mixC(c, C.violet, 0.25);
    const b = dim * (knot ? 1.5 : 0.75 + rand() * 0.5) * mix(0.24, 1.0, sstep(0.05, 0.6, rr)) * taper(rr);
    put(rng, d, x, gauss() * 0.011, z, scaleC(c, b), (knot ? 1.5 : 0.55) + Math.pow(rand(), 3) * 2.3);
  }
  for (let i = 0; i < knots; i++) {
    // bold star-forming knots strung along the two main arms
    const r = 0.2 + Math.pow(rand(), 0.85) * 0.72;
    const th = armAngle(rand() < 0.5 ? 0 : 1, r) + gauss() * 0.03;
    const c = discColor(r / GAL_R, rand() < 0.5 ? 1 : rand() < 0.6 ? 2 : 3);
    const tp = taper(r / GAL_R);
    put(rng, d, r * Math.cos(th) + gauss() * 0.02, gauss() * 0.008, r * Math.sin(th) + gauss() * 0.02, c, (3.4 + rand() * 4.0) * mix(0.55, 1, tp));
  }
  return d;
}

function buildHaze(rng: Rng, n: number): Cloud {
  // big soft sprites: the painted glow, no bloom pass
  const { rand, gauss } = rng;
  const d = alloc(n);
  for (let i = 0; i < n; i++) {
    const r = 0.1 + Math.pow(rand(), 0.8) * 0.92;
    const arm = rand() < 0.5 ? 0 : 1;
    const th = armAngle(arm, r) + gauss() * 0.05;
    const sig = 0.03 + 0.05 * r;
    const tp = taper(r / GAL_R);
    const c = discColor(clamp(r / GAL_R + gauss() * 0.06, 0, 1), rand() < 0.2 ? 1 : 0);
    put(rng, d, r * Math.cos(th) + gauss() * sig, gauss() * 0.01, r * Math.sin(th) + gauss() * sig, scaleC(c, tp), 26 + rand() * 46);
  }
  return d;
}

function buildBody(rng: Rng, n: number): Cloud {
  // a continuous soft disc under the arms, so the gaps between them still glow
  const { rand, gauss } = rng;
  const d = alloc(n);
  for (let i = 0; i < n; i++) {
    const r = 0.22 - Math.log(1 - rand() * 0.88) * 0.36; // starts outside the bulge, which is bright enough already
    const th = rand() * TAU;
    const c = mixC(discColor(clamp(r / GAL_R, 0, 1), 0), C.gold, 0.25);
    put(rng, d, r * Math.cos(th), gauss() * 0.008, r * Math.sin(th), c, 70 + rand() * 90);
  }
  return d;
}

function buildDust(rng: Rng, n: number): Cloud {
  // dark lanes hugging the inner edge of the two main arms
  const { rand, gauss } = rng;
  const d = alloc(n);
  while (d.n < n) {
    const arm = rand() < 0.5 ? 0 : 1;
    const r = 0.27 + Math.pow(rand(), 0.9) * 0.66;
    const th = armAngle(arm, r);
    if (rand() > 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(th * 5 + arm * 2.1))) continue; // patchy, not a painted stripe
    const rr = r - (0.03 + 0.05 * r) + gauss() * 0.008;
    const k = (0.6 + rand() * 0.4) * sstep(0.25, 0.4, r) * (1 - sstep(0.7, 0.93, r)); // thins toward core and rim
    put(rng, d, rr * Math.cos(th), gauss() * 0.004, rr * Math.sin(th), [0.62 * k, 0.78 * k, 0.95 * k], 5 + rand() * 8); // takes more blue than red
  }
  return d;
}

function buildHalo(rng: Rng, n: number): Cloud {
  // sparse old stars around the disc
  const { rand } = rng;
  const d = alloc(n);
  for (let i = 0; i < n; i++) {
    const r = 0.25 + Math.pow(rand(), 1.4) * 1.75;
    const u = rand() * 2 - 1;
    const th = rand() * TAU;
    const s = Math.sqrt(1 - u * u);
    const c = mixC(C.gold, C.ink, rand());
    const b = 0.25 + Math.pow(rand(), 4) * 0.75;
    put(rng, d, r * s * Math.cos(th), r * u * 0.55, r * s * Math.sin(th), scaleC(c, b), 0.5 + Math.pow(rand(), 5) * 2.2);
  }
  return d;
}

function buildCompanion(rng: Rng, n: number): { stars: Cloud; glow: Cloud } {
  // one small companion galaxy: small stars, then four faint glow sprites
  const { rand, gauss } = rng;
  const [sx, sy, sz] = SATELLITE;
  const stars = alloc(n);
  for (let i = 0; i < n; i++) {
    const c = mixC(C.azure, rand() < 0.3 ? C.rose : C.ink, rand() * 0.7);
    const b = 0.5 + rand() * 0.5;
    put(rng, stars, sx + gauss() * 0.06, sy + gauss() * 0.025, sz + gauss() * 0.04, scaleC(c, b), 0.5 + Math.pow(rand(), 3) * 1.8);
  }
  const glow = alloc(4);
  for (let i = 0; i < 4; i++) {
    put(rng, glow, sx + gauss() * 0.025, sy, sz + gauss() * 0.025, scaleC(mixC(C.azure, C.violet, rand()), 0.1), 30 + rand() * 20);
  }
  return { stars, glow };
}

function buildCore(rng: Rng): Cloud {
  const d = alloc(2);
  put(rng, d, 0, 0, 0, C.gold, 125);
  put(rng, d, 0, 0, 0, C.white, 34);
  return d;
}

const STAR_R = 9000;
function buildStars(rng: Rng, n: number): Cloud {
  const { rand } = rng;
  const d = alloc(n);
  for (let i = 0; i < n; i++) {
    const u = rand() * 2 - 1;
    const th = rand() * TAU;
    const s = Math.sqrt(1 - u * u);
    const k = rand();
    const c: RGB = k < 0.6 ? C.ink : k < 0.8 ? [0.72, 0.84, 1.0] : k < 0.93 ? C.gold : C.rose;
    const b = 0.35 + Math.pow(rand(), 3) * 0.65;
    put(rng, d, STAR_R * s * Math.cos(th), STAR_R * u, STAR_R * s * Math.sin(th), scaleC(c, b), 1.1 + Math.pow(rand(), 5) * 2.6);
  }
  return d;
}

function buildWash(rng: Rng): Cloud {
  // a few enormous, very faint colour fields far behind everything
  const spots: [number, number, number, RGB, number][] = [
    [0.75, 0.05, -1, C.violet, 900],
    [0.2, -0.55, -1, C.azure, 760],
    [-0.5, 0.25, -1, C.violet, 620],
    [1.1, -0.7, -0.6, C.rose, 700],
    [-0.1, -1.3, -0.5, C.azure, 820],
    [0.9, -1.5, -0.2, C.violet, 760],
    [-0.9, -1.2, -0.3, C.teal, 520],
  ];
  const d = alloc(spots.length);
  for (const [x, y, z, c, s] of spots) {
    const k = STAR_R / Math.hypot(x, y, z);
    put(rng, d, x * k, y * k, z * k, c, s);
  }
  return d;
}

// ---------- S2 (D-111): texture and life in the disc ----------
// Each layer has its own random stream, so none of them moves the galaxy or the web above.

const leadOf = (arm: number) => (arm > 1 ? 0.75 : 1);

/**
 * Flocculent filaments: many short, thin arcs at the arms' own pitch, starting anywhere in the
 * disc. Together they give the disc the streaked, combed look of the references, between the
 * arms as well as on them.
 */
function buildFilaments(n: number): Cloud {
  const rng = makeRng(20261121);
  const { rand, gauss } = rng;
  const d = alloc(n);
  while (d.n < n) {
    const r0 = 0.1 + Math.pow(rand(), 0.75) * 0.98;
    const th0 = rand() * TAU;
    const span = 0.35 + rand() * 1.1; // radians of turn
    const width = 0.003 + rand() * 0.007;
    const k = rand();
    const tint: RGB | null = k < 0.22 ? C.magenta : k < 0.48 ? C.young : k < 0.6 ? C.violet : null;
    const gain = 0.35 + rand() * 0.45;
    const m = Math.min(n - d.n, 30 + ((rand() * 60) | 0));
    for (let i = 0; i < m; i++) {
      const u = rand() * span;
      const r = r0 * Math.exp(u / WIND);
      const th = th0 + u;
      const rr = r / GAL_R;
      if (rr > 1.02) continue;
      let c = discColor(clamp(rr + gauss() * 0.03, 0, 1), 0);
      if (tint && rr > 0.22) c = mixC(c, tint, 0.55);
      const b = gain * mix(0.18, 1, sstep(0.06, 0.45, rr)) * taper(rr);
      put(rng, d, r * Math.cos(th) + gauss() * width, gauss() * 0.006, r * Math.sin(th) + gauss() * width, scaleC(c, b), 0.5 + Math.pow(rand(), 3) * 1.4);
    }
  }
  return d;
}

/**
 * Young life on the arms: tight clumps of stars, pink where new stars light their gas, blue-white
 * where young clusters have cleared it. Each clump also gets one soft glow sprite (`glow`).
 */
function buildClusters(clumps: number): { stars: Cloud; glow: Cloud } {
  const rng = makeRng(20261122);
  const { rand, gauss } = rng;
  const stars = alloc(clumps * 34);
  const glow = alloc(clumps);
  for (let j = 0; j < clumps; j++) {
    const a = rand();
    const arm = a < ARM_W[0] ? 0 : a < ARM_W[1] ? 1 : a < ARM_W[2] ? 2 : 3;
    const r = 0.18 + Math.pow(rand(), 0.8) * 0.88;
    const rr = r / GAL_R;
    const th = armAngle(arm, r) + gauss() * 0.04 + 0.03;
    const cx = r * Math.cos(th);
    const cz = r * Math.sin(th);
    const pink = rand() < 0.55;
    const base = pink ? C.magenta : C.young;
    const spread = 0.004 + rand() * 0.01;
    const tp = taper(rr) * leadOf(arm);
    const m = 10 + ((rand() * 24) | 0);
    for (let i = 0; i < m; i++) {
      const c = mixC(base, C.white, rand() * 0.35);
      put(rng, stars, cx + gauss() * spread, gauss() * 0.004, cz + gauss() * spread, scaleC(c, (0.7 + rand() * 0.8) * tp), 0.7 + Math.pow(rand(), 2) * 1.8);
    }
    put(rng, glow, cx, 0, cz, scaleC(base, tp * (0.6 + rand() * 0.6)), 5 + rand() * 9 + spread * 500);
  }
  return { stars, glow };
}

/** Violet, blue and rose clouds of gas, clumped along the arms' leading edges and in the outer disc. */
function buildClouds(n: number): Cloud {
  const rng = makeRng(20261123);
  const { rand, gauss } = rng;
  const d = alloc(n);
  while (d.n < n) {
    const arm = (rand() * 4) | 0;
    const r = 0.3 + Math.pow(rand(), 0.7) * 0.85;
    const rr = r / GAL_R;
    const th = armAngle(arm, r) + (rand() < 0.6 ? 0.12 + rand() * 0.35 : rand() * TAU);
    const k = rand();
    const base = k < 0.45 ? C.violet : k < 0.8 ? C.azure : C.magenta;
    const m = Math.min(n - d.n, 3 + ((rand() * 5) | 0));
    const spread = 0.02 + 0.04 * rand();
    for (let i = 0; i < m; i++) {
      put(rng, d, r * Math.cos(th) + gauss() * spread, gauss() * 0.01, r * Math.sin(th) + gauss() * spread, scaleC(mixC(base, discColor(rr, 0), 0.3), taper(rr) * (0.5 + rand() * 0.5)), 12 + rand() * 26);
    }
  }
  return d;
}

/** Fine dust: thin dark lanes on the inner edge of all four arms, and dark filaments between them. */
function buildFineDust(n: number): Cloud {
  const rng = makeRng(20261124);
  const { rand, gauss } = rng;
  const d = alloc(n);
  while (d.n < n) {
    const lane = rand() < 0.55;
    const arm = (rand() * 4) | 0;
    const r0 = lane ? 0.2 + rand() * 0.75 : 0.18 + Math.pow(rand(), 0.8) * 0.85;
    const th0 = lane ? armAngle(arm, r0) - 0.06 - 0.04 * rand() : rand() * TAU;
    const span = 0.2 + rand() * 0.8;
    const m = Math.min(n - d.n, 8 + ((rand() * 14) | 0));
    for (let i = 0; i < m; i++) {
      const u = rand() * span;
      const r = r0 * Math.exp(u / WIND);
      const rr = r / GAL_R;
      const th = th0 + u;
      const k = (0.5 + rand() * 0.5) * sstep(0.14, 0.3, rr) * (1 - sstep(0.85, 1.0, rr));
      put(rng, d, r * Math.cos(th) + gauss() * 0.004, gauss() * 0.003, r * Math.sin(th) + gauss() * 0.004, [0.6 * k, 0.75 * k, 0.95 * k], 2.2 + rand() * 3.5);
    }
  }
  return d;
}

/** The heart's warm glow: a few large gold and amber sprites, wider than the core's own. */
function buildHeart(): Cloud {
  const rng = makeRng(20261125);
  const d = alloc(4);
  put(rng, d, 0, 0, 0, C.gold, 260);
  put(rng, d, 0, 0, 0, C.amber, 190);
  put(rng, d, 0, 0, 0, mixC(C.gold, C.white, 0.5), 90);
  put(rng, d, 0, 0, 0, C.white, 40);
  return d;
}

/**
 * The heart (D-112, D-113): no dark spot, since in galaxy images the centre is a blaze of light.
 * A white-hot disc of gas turning fast around the hole, and streams of light spiralling in from
 * the bulge, brightest where they converge. One cloud, one draw call.
 */
export const HOLE_R = 0.02;
function buildNucleus(n: number): Cloud {
  const rng = makeRng(20261127);
  const { rand, gauss } = rng;
  const d = alloc(n);
  const ring = Math.round(n * 0.1);
  const disc = Math.round(n * 0.4);
  for (let i = 0; i < ring; i++) {
    const th = rand() * TAU;
    const r = Math.abs(gauss()) * HOLE_R * 1.6;
    put(rng, d, r * Math.cos(th), gauss() * 0.0008, r * Math.sin(th), scaleC(mixC(C.white, C.gold, rand() * 0.4), 1.6), 1.0 + rand() * 0.7);
  }
  for (let i = 0; i < disc; i++) {
    const u = Math.pow(rand(), 1.6); // crowded toward the inner edge
    const r = HOLE_R * 1.2 + u * 0.09;
    const th = rand() * TAU;
    const hot = 1 - u;
    // rings of brighter and fainter gas, so the disc has grain rather than a flat glow
    const band = 0.55 + 0.45 * Math.sin(r * 520);
    const c = u < 0.2 ? mixC(C.white, C.gold, u / 0.2) : u < 0.6 ? mixC(C.gold, C.amber, (u - 0.2) / 0.4) : mixC(C.amber, C.ember, (u - 0.6) / 0.4);
    put(rng, d, r * Math.cos(th), gauss() * 0.0015 * (1 + u * 2), r * Math.sin(th), scaleC(c, (0.22 + hot * 0.6) * band), 0.5 + Math.pow(rand(), 3) * 0.9);
  }
  while (d.n < n) {
    // a stream: a tight spiral from the bulge into the disc, thinner and hotter as it falls
    const k = (rand() * 5) | 0;
    const u = rand();
    const r = mix(0.5, HOLE_R * 1.4, Math.pow(u, 0.7));
    const th = k * (TAU / 5) + 1.9 * Math.log(0.5 / r);
    const w = 0.004 + 0.02 * (1 - u);
    const c = mixC(mixC(C.rose, C.amber, 0.5), C.gold, u);
    put(rng, d, r * Math.cos(th) + gauss() * w, gauss() * 0.003, r * Math.sin(th) + gauss() * w, scaleC(c, 0.15 + u * 0.55), 0.5 + rand() * 0.8);
  }
  return d;
}

/** One cloud from two, the second's light scaled by `k` (fewer layers, fewer draw calls). */
export function joinClouds(a: Cloud, b: Cloud, k: number): Cloud {
  const d = alloc(a.n + b.n);
  d.pos.set(a.pos.subarray(0, a.n * 3));
  d.col.set(a.col.subarray(0, a.n * 3));
  d.size.set(a.size.subarray(0, a.n));
  d.seed.set(a.seed.subarray(0, a.n));
  d.pos.set(b.pos.subarray(0, b.n * 3), a.n * 3);
  for (let i = 0; i < b.n * 3; i++) d.col[a.n * 3 + i] = b.col[i] * k;
  d.size.set(b.size.subarray(0, b.n), a.n);
  d.seed.set(b.seed.subarray(0, b.n), a.n);
  d.n = a.n + b.n;
  return d;
}

/** New for production: a small bright heart, so the core is not dull at the `low` count. */
function buildBulge(n: number): Cloud {
  const rng = makeRng(20261114); // its own stream, so it never shifts the approved galaxy
  const { rand, gauss } = rng;
  const d = alloc(n);
  for (let i = 0; i < n; i++) {
    const x = gauss() * 0.05;
    const z = gauss() * 0.05;
    const r = Math.hypot(x, z);
    const c = mixC(C.white, C.gold, clamp(r / 0.1, 0, 1));
    put(rng, d, x, gauss() * 0.02 * Math.exp(-r * 6), z, scaleC(c, 0.55), 0.9 + rand() * 1.4);
  }
  return d;
}

/**
 * How bright the galaxy is at a point of its own plane, 0 to 1, in the coordinates the disc was
 * built in (before the pattern turns). A rough model of the layers above, used only to keep map
 * labels off the bright parts as the disc turns (DESIGN_SPEC.md section 10).
 */
export function discBrightness(x: number, z: number): number {
  const r = Math.hypot(x, z);
  if (r > 1.15) return 0;
  const th = Math.atan2(z, x);
  let arms = 0;
  for (let arm = 0; arm < 4; arm++) {
    let d = (th - armAngle(arm, Math.max(r, 0.05))) % TAU;
    if (d > Math.PI) d -= TAU;
    if (d < -Math.PI) d += TAU;
    // an arm's width as an angle; the feathers trail behind it, so that side is wider
    const sig = (((arm > 1 ? 0.02 : 0.027) + 0.065 * r) / Math.max(r, 0.12)) * (d < 0 ? 2.4 : 1.5);
    arms = Math.max(arms, (arm > 1 ? 0.45 : 1) * Math.exp(-(d * d) / (2 * sig * sig)));
  }
  const edge = 1 - sstep(0.8, 1.1, r);
  return clamp(Math.exp(-r / 0.17) * 1.3 + edge * (0.14 + 0.86 * arms), 0, 1);
}

// ---------- level 2: the cosmic web ----------
export type Vec3 = [number, number, number];

/** A thread of the web between two knots. Only the home thread has a control point. */
export interface Thread {
  a: Vec3;
  b: Vec3;
  ia: number;
  ib: number;
  via?: Vec3;
}

export interface Web {
  nodes: Vec3[];
  threads: Thread[];
}

/** Web points keep this far from the home galaxy, so its hotspot and the galaxy itself stay clear. */
const WEB_CLEAR = 60;

function buildWebNodes(rng: Rng, narrow: boolean): Vec3[] {
  // A narrow screen sees a narrow slice, so the web is built only as large as the view needs.
  // The phone volume is smaller than the prototype's (which looked thin there), so the same
  // knots and points sit closer together. The count is unchanged: it fixes how much of the
  // random sequence is used before the galaxy is built.
  const count = narrow ? 85 : 170;
  const [halfX, halfY, halfZ] = narrow ? [1300, 320, 2300] : [3600, 420, 3000];
  const nodes: Vec3[] = [[0, 0, 0]];
  for (let i = 1; i < count; i++) nodes.push([(rng.rand() * 2 - 1) * halfX, (rng.rand() * 2 - 1) * halfY, (rng.rand() * 2 - 1) * halfZ]);
  return nodes;
}

/**
 * Threads between near neighbours, as in the prototype, with one change: the home galaxy is not
 * a knot in a void but a point on a thread (DESIGN_SPEC.md section 10). The two nearest knots on
 * opposite sides of it are joined by a curve that passes through the origin.
 */
function buildThreads(nodes: Vec3[]): Thread[] {
  const pairs: [number, number][] = [];
  for (let i = 1; i < nodes.length; i++) {
    const a = nodes[i];
    const near: [number, number][] = [];
    for (let j = 1; j < nodes.length; j++) {
      if (j !== i) near.push([j, Math.hypot(a[0] - nodes[j][0], a[1] - nodes[j][1], a[2] - nodes[j][2])]);
    }
    near.sort((p, q) => p[1] - q[1]);
    for (const [j] of near.slice(0, 3)) {
      if (!pairs.some((e) => e[0] === j && e[1] === i)) pairs.push([i, j]);
    }
  }
  const threads: Thread[] = pairs.map(([ia, ib]) => ({ a: nodes[ia], b: nodes[ib], ia, ib }));

  const flat = (v: Vec3) => Math.hypot(v[0], v[2]);
  let ia = 1;
  for (let i = 2; i < nodes.length; i++) if (flat(nodes[i]) < flat(nodes[ia])) ia = i;
  const a = nodes[ia];
  let ib = -1;
  let straightest = -1;
  let lowest = 1;
  for (let i = 1; i < nodes.length; i++) {
    if (i === ia) continue;
    const b = nodes[i];
    const cos = (a[0] * b[0] + a[2] * b[2]) / (flat(a) * flat(b));
    if (cos < lowest) {
      lowest = cos;
      straightest = i;
    }
    if (cos < -0.4 && (ib < 0 || flat(b) < flat(nodes[ib]))) ib = i; // the nearest knot on the far side
  }
  if (ib < 0) ib = straightest;
  const b = nodes[ib];
  // a quadratic curve through the origin at its middle: 0.25 a + 0.5 via + 0.25 b = 0
  threads.push({ a, b, ia, ib, via: [-(a[0] + b[0]) / 2, -(a[1] + b[1]) / 2, -(a[2] + b[2]) / 2] });
  return threads;
}

function alongThread(rng: Rng, threads: Thread[], jit: number): Vec3 {
  const { rand, gauss } = rng;
  const e = threads[(rand() * threads.length) | 0];
  const t = rand();
  if (e.via) {
    const u = 1 - t;
    const k = (i: 0 | 1 | 2) => u * u * e.a[i] + 2 * u * t * e.via![i] + t * t * e.b[i] + gauss() * jit;
    return [k(0), k(1), k(2)];
  }
  const sag = Math.sin(t * Math.PI) * 60; // threads bow a little so the web is not a wireframe
  return [
    mix(e.a[0], e.b[0], t) + gauss() * jit + sag * Math.sin(e.ia),
    mix(e.a[1], e.b[1], t) + gauss() * jit,
    mix(e.a[2], e.b[2], t) + gauss() * jit + sag * Math.cos(e.ib),
  ];
}

/** Every point is a galaxy: clusters at the knots, the rest strung along the threads. `sizeK` makes fewer points larger. */
function buildWeb(rng: Rng, n: number, web: Web, sizeK: number): Cloud {
  const { rand, gauss } = rng;
  const d = alloc(n);
  while (d.n < n) {
    let p: Vec3;
    let c: RGB;
    let s: number;
    if (rand() < 0.36) {
      const i = (rand() * web.nodes.length) | 0;
      if (i === 0) continue; // the home galaxy is not a cluster
      const k = web.nodes[i];
      p = [k[0] + gauss() * 95, k[1] + gauss() * 70, k[2] + gauss() * 95];
      c = mixC(C.gold, C.white, rand());
      s = 1000 + Math.pow(rand(), 2) * 1700;
    } else {
      p = alongThread(rng, web.threads, 20);
      c = mixC(C.violet, C.azure, rand());
      const k = rand();
      if (k < 0.14) c = C.rose;
      else if (k < 0.22) c = C.teal;
      c = [Math.min(1, c[0] * 1.3), Math.min(1, c[1] * 1.3), Math.min(1, c[2] * 1.3)];
      s = 720 + Math.pow(rand(), 3) * 1300;
    }
    if (Math.hypot(p[0], p[1], p[2]) < WEB_CLEAR) continue;
    put(rng, d, p[0], p[1], p[2], c, s * sizeK);
  }
  return d;
}

/** Soft light along the threads and around the knots. `carry` lets fewer thread sprites hold the same light. */
function buildWebGlow(rng: Rng, n: number, web: Web, carry: number): Cloud {
  const { rand } = rng;
  const d = alloc(n + web.nodes.length);
  while (d.n < n) {
    const p = alongThread(rng, web.threads, 10);
    if (Math.hypot(p[0], p[1], p[2]) < WEB_CLEAR) continue;
    put(rng, d, p[0], p[1], p[2], scaleC(mixC(C.violet, C.azure, rand()), carry), 9000 + rand() * 9000);
  }
  web.nodes.forEach((k, i) => {
    if (i) put(rng, d, k[0], k[1], k[2], scaleC(mixC(C.gold, C.rose, rand() * 0.6), 1.5), 34000 + rand() * 24000);
  });
  return d;
}

/** S2: a bright, narrow strand of gas down the middle of each thread, and a hot light at each knot. */
function buildWebStrands(n: number, web: Web): Cloud {
  const rng = makeRng(20261126);
  const { rand } = rng;
  const d = alloc(n + web.nodes.length);
  while (d.n < n) {
    const p = alongThread(rng, web.threads, 6);
    if (Math.hypot(p[0], p[1], p[2]) < WEB_CLEAR) continue;
    const k = rand();
    const c = k < 0.5 ? mixC(C.violet, C.azure, rand()) : k < 0.8 ? mixC(C.azure, C.young, rand()) : C.magenta;
    put(rng, d, p[0], p[1], p[2], c, 2200 + rand() * 3200);
  }
  web.nodes.forEach((k, i) => {
    if (i) put(rng, d, k[0], k[1], k[2], mixC(C.white, C.gold, rand() * 0.6), 7000 + rand() * 7000);
  });
  return d;
}

// ---------- counts per tier (ARCHITECTURE.md 3.4) ----------
export interface Counts {
  disc: number;
  stars: number;
  halo: number;
  companion: number;
  body: number;
  haze: number;
  dust: number;
  bulge: number;
  /** Brightness of each disc point in the phone composition: fewer points each carry more light. */
  discAlpha: number;
  /** The same for wide screens, where the disc fills the frame and thin tiers show most. */
  discAlphaWide: number;
  /** Level 2 (ARCHITECTURE.md 3.4): the galaxies of the web, and the soft sprites along its threads. */
  web: number;
  webGlow: number;
  /** Fewer web points are each drawn larger, so the threads stay readable. */
  webSize: number;
  /** S2 (D-111): filaments, young clumps, gas clouds, fine dust, and the web's bright strands. */
  filaments: number;
  clusters: number;
  clouds: number;
  fineDust: number;
  webStrands: number;
  /** D-112, D-113: the heart's light: its hot core, the disc around the hole, the streams feeding it. */
  nucleus: number;
}

/** `high` is the prototype's desktop build; `low` is its phone build cut to the 40k budget. */
export const COUNTS: Record<ParticleTier, Counts> = {
  high: { disc: 160000, stars: 13000, halo: 6500, companion: 2600, body: 700, haze: 2200, dust: 2800, bulge: 0, discAlpha: 0.52, discAlphaWide: 0.52, web: 60000, webGlow: 6000, webSize: 1, filaments: 60000, clusters: 1100, clouds: 1800, fineDust: 9000, webStrands: 9000, nucleus: 16000 },
  medium: { disc: 90000, stars: 10000, halo: 4500, companion: 1800, body: 500, haze: 1550, dust: 1950, bulge: 0, discAlpha: 0.68, discAlphaWide: 0.8, web: 35000, webGlow: 4000, webSize: 1.15, filaments: 32000, clusters: 700, clouds: 1200, fineDust: 5500, webStrands: 6000, nucleus: 10000 },
  low: { disc: 40000, stars: 6000, halo: 2500, companion: 1000, body: 320, haze: 900, dust: 1100, bulge: 1400, discAlpha: 0.9, discAlphaWide: 1.4, web: 15000, webGlow: 2500, webSize: 1.35, filaments: 12000, clusters: 350, clouds: 600, fineDust: 2500, webStrands: 3500, nucleus: 5000 },
};

export interface AtlasData {
  webNodes: Vec3[];
  web: Cloud;
  webGlow: Cloud;
  wash: Cloud;
  stars: Cloud;
  body: Cloud;
  haze: Cloud;
  halo: Cloud;
  companionStars: Cloud;
  companionGlow: Cloud;
  disc: Cloud;
  bulge: Cloud;
  dust: Cloud;
  core: Cloud;
  filaments: Cloud;
  clusterStars: Cloud;
  clusterGlow: Cloud;
  clouds: Cloud;
  fineDust: Cloud;
  heart: Cloud;
  webStrands: Cloud;
  nucleus: Cloud;
}

/**
 * Builds in the prototype's order: web knots, wash, stars, body, haze, halo, companion, disc,
 * dust, core, then the web's glow and points. The web comes last, so nothing about it can
 * change the approved galaxy.
 */
export function buildAtlas(tier: ParticleTier, narrow: boolean): AtlasData {
  const rng = makeRng();
  const n = COUNTS[tier];
  const webNodes = buildWebNodes(rng, narrow);
  const web: Web = { nodes: webNodes, threads: buildThreads(webNodes) };
  const wash = buildWash(rng);
  const stars = buildStars(rng, n.stars);
  const body = buildBody(rng, n.body);
  const haze = buildHaze(rng, n.haze);
  const halo = buildHalo(rng, n.halo);
  const companion = buildCompanion(rng, n.companion);
  const disc = buildGalaxy(rng, n.disc);
  const dust = buildDust(rng, n.dust);
  const core = buildCore(rng);
  const webGlow = buildWebGlow(rng, n.webGlow, web, Math.sqrt(COUNTS.high.webGlow / n.webGlow));
  const webPoints = buildWeb(rng, n.web, web, n.webSize);
  const clusters = buildClusters(n.clusters);
  return {
    webNodes,
    web: webPoints,
    webGlow,
    wash,
    stars,
    body,
    haze,
    halo,
    companionStars: companion.stars,
    companionGlow: companion.glow,
    disc,
    bulge: buildBulge(n.bulge),
    dust,
    core,
    filaments: buildFilaments(n.filaments),
    clusterStars: clusters.stars,
    clusterGlow: clusters.glow,
    clouds: buildClouds(n.clouds),
    fineDust: buildFineDust(n.fineDust),
    heart: buildHeart(),
    webStrands: buildWebStrands(n.webStrands, web),
    nucleus: buildNucleus(n.nucleus),
  };
}
