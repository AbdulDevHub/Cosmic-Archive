/**
 * The fleet (D-118, redesigned in D-120 after the owner's brief, `context/SHIP_BRIEF.md`): five
 * ships, one per class, each with its own silhouette, read from above as the start page shows
 * them. Built in code from lathed hulls, extruded plates with curved outlines, struts and tubes;
 * nose toward +x, y up, z to the side. Each lists its engine nozzles for the glows and trails
 * (`start.ts`) and a `size` so the Colossus dwarfs the rest. Blender models loaded as `.glb` are
 * the future path (D-119).
 *
 * Parts (`aPart`) pick the material in the start scene's shader; `aLit` marks hull that carries
 * rows of lit windows on its sides:
 *
 *   0 silver metal   1 canopy glass   2 engine housing   3 gold        4 gunmetal
 *   5 blue light     6 red light      7 pearl white      8 blue paint  9 white paint
 *   10 steel         11 deep navy     12 graphite        13 blue glow
 *   14 cream         15 orange paint  16 amber light     17 engine housing, amber
 *   18 charcoal
 */

import {
  BoxGeometry,
  BufferAttribute,
  CatmullRomCurve3,
  Path,
  CylinderGeometry,
  ExtrudeGeometry,
  LatheGeometry,
  Matrix4,
  Shape,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ShipClass } from "@/lib/ship";

export type Vec3 = [number, number, number];
type P2 = [number, number];

export interface ShipModel {
  geometry: BufferGeometry;
  /** Engine nozzles, in the ship's own frame (at most four). */
  nozzles: Vec3[];
  /** How wide each engine's glow is, relative to the first fleet's. */
  glow: number;
  /** How large the ship is drawn, relative to the first fleet's. */
  size: number;
  /** The colour of its engines' glow and trails (blue when left out). */
  flame?: Vec3;
}

/** The fleet's engine light: blue. */
export const FLAME: Vec3 = [0.2, 0.5, 1.0];

/** Material ids (see the header). */
const SILVER = 0, GLASS = 1, ENGINE = 2, GOLD = 3, GUNMETAL = 4, BLUE = 5, RED = 6, PEARL = 7, STEEL = 10, NAVY = 11, GRAPHITE = 12, GLOW = 13, CREAM = 14, ORANGE = 15, EMBER = 16, FORGE = 17, CHARCOAL = 18;

const ALONG_X = new Matrix4().makeRotationZ(-Math.PI / 2); // lathes and cylinders stand on y; lay them along x (+y becomes +x)
const FLAT = new Matrix4().makeRotationX(Math.PI / 2); // extruded outlines lie in x-y; lay them in x-z

/** One part: plain positions and normals, its material, whether it is windowed, moved into place. */
function part(geometry: BufferGeometry, which: number, at: Vec3 = [0, 0, 0], transform?: Matrix4, lit = false): BufferGeometry {
  let g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g.getAttribute("uv")) g.deleteAttribute("uv");
  if (transform) g = g.applyMatrix4(transform);
  g.translate(at[0], at[1], at[2]);
  const n = g.getAttribute("position").count;
  g.setAttribute("aPart", new BufferAttribute(new Float32Array(n).fill(which), 1));
  g.setAttribute("aLit", new BufferAttribute(new Float32Array(n).fill(lit ? 1 : 0), 1));
  return g;
}

function shape(points: P2[]): Shape {
  const s = new Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const [a, b] of points.slice(1)) s.lineTo(a, b);
  return s;
}

/** A flat plate from an outline in the x-z plane (x forward, z to the side), its flat top at `y` (its bevel rises a little above). */
function plate(points: P2[], depth: number, which: number, y: number, lit = false): BufferGeometry {
  const g = new ExtrudeGeometry(shape(points), { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: Math.min(depth * 0.4, 0.008), bevelSegments: 1, curveSegments: 4 });
  return part(g, which, [0, y, 0], FLAT, lit);
}

/** An upright fin from an outline in the x-y plane, centred on `z`. */
function fin(points: P2[], thick: number, which: number, z: number, tilt = 0, pivotY = 0): BufferGeometry {
  const g = new ExtrudeGeometry(shape(points), { depth: thick, bevelEnabled: true, bevelThickness: thick * 0.3, bevelSize: thick * 0.4, bevelSegments: 1 });
  g.translate(0, -pivotY, -thick / 2);
  if (tilt) g.rotateX(tilt);
  return part(g, which, [0, pivotY, z]);
}

/** A hull turned on a lathe along x: `profile` is [radius, position along x] from tail to nose. */
function hull(profile: P2[], segments: number, which: number, at: Vec3, scaleY = 1, scaleZ = 1, lit = false): BufferGeometry {
  const g = new LatheGeometry(profile.map(([r, a]) => new Vector2(r, a)), segments).applyMatrix4(ALONG_X).scale(1, scaleY, scaleZ);
  return part(g, which, at, undefined, lit);
}

/** A faceted hull (`sides` flat faces, one of them on top), turned like `hull`. */
function prism(profile: P2[], sides: number, which: number, at: Vec3, scaleY = 1, scaleZ = 1, lit = false): BufferGeometry {
  const g = new LatheGeometry(profile.map(([r, a]) => new Vector2(r, a)), sides, Math.PI / sides).applyMatrix4(ALONG_X).scale(1, scaleY, scaleZ);
  return part(g, which, at, undefined, lit);
}

/** Points round an ellipse in the x-z plane, centred on x = `cx`. */
function ellipse(cx: number, a: number, b: number, n = 48): P2[] {
  return Array.from({ length: n }, (_, i): P2 => [cx + a * Math.cos((i / n) * Math.PI * 2), b * Math.sin((i / n) * Math.PI * 2)]);
}

/** A flat ring: a plate from `outer` with `inner` cut out of it, its top at `y`. */
function ring(outer: P2[], inner: P2[], depth: number, which: number, y: number): BufferGeometry {
  const s = shape(outer);
  s.holes.push(new Path(inner.map(([a, b]) => new Vector2(a, b))));
  const g = new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: Math.min(depth * 0.4, 0.008), bevelSegments: 2, curveSegments: 4 });
  return part(g, which, [0, y, 0], FLAT);
}

/** A straight strut from `a` to `b`, its chord along x where it can be. */
function strut(a: Vec3, b: Vec3, chord: number, thick: number, which: number): BufferGeometry {
  const from = new Vector3(...a);
  const to = new Vector3(...b);
  const dir = to.clone().sub(from);
  const length = dir.length();
  dir.normalize();
  const across = new Vector3(1, 0, 0).addScaledVector(dir, -dir.x).normalize();
  const side = new Vector3().crossVectors(across, dir).normalize();
  const m = new Matrix4().makeBasis(across, dir, side).setPosition(from.add(to).multiplyScalar(0.5));
  return part(new BoxGeometry(chord, length, thick), which, [0, 0, 0], m);
}

/** A thin tube through `points`: trim, ribs and rings. */
function tube(points: Vec3[], radius: number, which: number, closed = false): BufferGeometry {
  const curve = new CatmullRomCurve3(points.map((p) => new Vector3(...p)), closed);
  return part(new TubeGeometry(curve, Math.max(24, points.length * 10), radius, 6, closed), which);
}

/** Points along a quadratic curve from `a` (left out) through control `c` to `b`. */
function bend(a: P2, c: P2, b: P2, n = 8): P2[] {
  const out: P2[] = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n;
    const u = 1 - t;
    out.push([u * u * a[0] + 2 * u * t * c[0] + t * t * b[0], u * u * a[1] + 2 * u * t * c[1] + t * t * b[1]]);
  }
  return out;
}

/** A whole outline from its right half, running from the nose (z = 0) to the tail (z = 0). */
function sym(half: P2[]): P2[] {
  return [...half, ...half.slice(1, -1).reverse().map(([x, z]) => [x, -z] as P2)];
}

const flipZ = (points: P2[]): P2[] => points.map(([x, z]) => [x, -z]);

function merge(parts: BufferGeometry[]): BufferGeometry {
  const ship = mergeGeometries(parts);
  if (!ship) throw new Error("ships: the parts did not merge");
  ship.computeBoundingSphere();
  return ship;
}

/**
 * Sovereign, the elegant flagship (V1 sheet, as close as the owner asked): a broad elliptical
 * saucer, a long tapered secondary hull beneath and behind it, and two long nacelles raised on
 * swept pylons, their tops lit blue along their length.
 */
function sovereign(): ShipModel {
  // the saucer: thin at the rim, domed above, flatter below (bottom centre to rim to top centre)
  const saucerProfile: P2[] = [
    [0, -0.04], [0.1, -0.038], [0.2, -0.032], [0.29, -0.022], [0.335, -0.011], [0.345, 0], [0.335, 0.011], [0.3, 0.026], [0.24, 0.043], [0.16, 0.06], [0.08, 0.07], [0, 0.073],
  ];
  const saucer = new LatheGeometry(saucerProfile.map(([r, y]) => new Vector2(r, y)), 72).scale(1.12, 1, 0.94);
  const parts = [
    part(saucer, SILVER, [0.3, 0.05, 0], undefined, true),
    // the bridge: a low dome atop the saucer, ringed by glass
    part(new SphereGeometry(0.05, 20, 10).scale(1.2, 0.45, 1), SILVER, [0.32, 0.12, 0]),
    part(new TorusGeometry(0.05, 0.006, 6, 32).rotateX(Math.PI / 2).scale(1.2, 1, 1), GLASS, [0.32, 0.118, 0]),
    // rings of darker plating across the saucer's top, where its decks step down
    ...[
      [0.17, 0.108],
      [0.27, 0.083],
    ].map(([r, y]) => part(new TorusGeometry(r, 0.004, 4, 80).rotateX(Math.PI / 2).scale(1.12, 1, 0.94), GUNMETAL, [0.3, y, 0])),
    // a ring of light around the saucer's rim and its impulse deck at the back
    part(new TorusGeometry(0.345, 0.0035, 4, 96).rotateX(Math.PI / 2).scale(1.12, 1, 0.94), BLUE, [0.3, 0.05, 0]),
    part(new BoxGeometry(0.03, 0.022, 0.16), ENGINE, [-0.06, 0.055, 0]),
    // the neck down to the secondary hull
    fin([[0.2, 0.03], [0.04, 0.03], [-0.1, -0.05], [0.08, -0.05]], 0.06, SILVER, 0),
    // the secondary hull, with its deflector glowing at the front
    hull([[0, -0.66], [0.022, -0.65], [0.042, -0.58], [0.055, -0.42], [0.062, -0.2], [0.064, 0], [0.056, 0.08], [0.036, 0.12], [0, 0.135]], 40, SILVER, [0, -0.085, 0], 0.85, 1.15, true),
    part(new SphereGeometry(0.03, 16, 10).scale(0.45, 1, 1.1), GLOW, [0.128, -0.09, 0]),
    ...[1, -1].flatMap((side) => [
      // swept pylons from the hull's back up and out to the nacelles
      strut([-0.3, -0.06, side * 0.04], [-0.46, 0.05, side * 0.26], 0.09, 0.016, SILVER),
      // the nacelles: long pods, their tops lit, a blue cap at the front
      hull([[0, 0], [0.026, 0.006], [0.034, 0.04], [0.036, 0.12], [0.036, 0.43], [0.031, 0.5], [0.016, 0.525], [0, 0.53]], 24, SILVER, [-0.8, 0.06, side * 0.27], 0.8, 1),
      part(new BoxGeometry(0.4, 0.006, 0.02), BLUE, [-0.55, 0.06 + 0.028, side * 0.27]),
      part(new SphereGeometry(0.03, 16, 10).scale(0.6, 0.75, 1), GLOW, [-0.275, 0.06, side * 0.27]),
    ]),
  ];
  return { geometry: merge(parts), nozzles: [[-0.8, 0.06, 0.27], [-0.8, 0.06, -0.27]], glow: 0.85, size: 0.72 };
}

/**
 * Predator, the intimidating cruiser (V1 sheet, refined in D-177): a long, flat, layered blade of
 * graphite split at the bow into two prongs, never a fighter's nose; two great sickle wings, a
 * broad upper pair and a narrower lower pair, sweeping out and back to points well behind the
 * stern; a stepped dorsal ridge; blue light only along the leading edges and in its four engines.
 */
function predator(): ShipModel {
  // the blade, its bow notched into two prongs
  const base = sym([[0.5, 0], [0.76, 0.04], [0.66, 0.075], [0.34, 0.1], [-0.1, 0.13], [-0.48, 0.125], [-0.58, 0.07], [-0.56, 0]]);
  const deck = sym([[0.46, 0], [0.56, 0.03], [0.3, 0.06], [-0.15, 0.08], [-0.46, 0.075], [-0.5, 0]]);
  const ridge = sym([[0.3, 0], [0.06, 0.03], [-0.3, 0.04], [-0.44, 0]]);
  const crest = sym([[0.08, 0], [-0.1, 0.016], [-0.34, 0.018], [-0.38, 0]]);
  const keel = sym([[0.42, 0], [0.1, 0.07], [-0.45, 0.09], [-0.52, 0]]);
  // the sickles: a leading edge bowed outward to a point far aft, a trailing edge curving back in
  const upperEdge: P2[] = [[0.16, 0.09], ...bend([0.16, 0.09], [0.02, 0.5], [-0.78, 0.56], 14)];
  const upper: P2[] = [...upperEdge, [-0.8, 0.545], ...bend([-0.8, 0.545], [-0.36, 0.36], [-0.42, 0.11], 12)];
  const lowerEdge: P2[] = [[0.02, 0.1], ...bend([0.02, 0.1], [-0.12, 0.36], [-0.62, 0.4], 12)];
  const lower: P2[] = [...lowerEdge, [-0.64, 0.39], ...bend([-0.64, 0.39], [-0.34, 0.24], [-0.4, 0.1], 10)];
  const droop = (side: number, a: number) => new Matrix4().makeRotationX(side * a);
  const parts = [
    plate(base, 0.04, GRAPHITE, 0.0, true),
    plate(deck, 0.03, GUNMETAL, 0.035),
    plate(ridge, 0.024, GRAPHITE, 0.062),
    plate(crest, 0.018, GUNMETAL, 0.084),
    plate(keel, 0.03, GRAPHITE, -0.04),
    // a glass slit far back on the ridge, never a fighter's cockpit
    part(new BoxGeometry(0.07, 0.008, 0.024), GLASS, [-0.06, 0.09, 0]),
    // the stern block that holds the main engines
    part(new BoxGeometry(0.1, 0.07, 0.22), GUNMETAL, [-0.52, 0.005, 0]),
    ...[1, -1].flatMap((side) => {
      const s = (points: P2[]) => (side > 0 ? points : flipZ(points));
      return [
        plate(s(upper), 0.022, GRAPHITE, 0.01).applyMatrix4(droop(side, 0.05)),
        plate(s(lower), 0.018, GUNMETAL, -0.03).applyMatrix4(droop(side, 0.14)),
        // blue light along each sickle's leading edge
        tube(upperEdge.slice(2, 12).map(([x, z]): Vec3 => [x, 0.022 - z * 0.05, side * z]), 0.0045, BLUE),
        // the main engines in the stern block, and a smaller pair at the wing roots
        part(new CylinderGeometry(0.036, 0.042, 0.1, 18), ENGINE, [-0.56, 0.005, side * 0.06], ALONG_X),
        part(new CylinderGeometry(0.024, 0.028, 0.1, 16), ENGINE, [-0.46, 0.005, side * 0.15], ALONG_X),
        // a red light at each sickle's point
        part(new BoxGeometry(0.012, 0.008, 0.012), RED, [-0.76, 0.0, side * 0.555]),
      ];
    }),
  ];
  return {
    geometry: merge(parts),
    nozzles: [[-0.61, 0.005, 0.06], [-0.61, 0.005, -0.06], [-0.51, 0.005, 0.15], [-0.51, 0.005, -0.15]],
    glow: 0.7,
    size: 0.9,
  };
}

/**
 * Celestial, the legendary vessel (the owner's `Celestial Starship.png`, D-210): a slender pearl
 * bow drawn to a fine point with manta wings drooping from it, then a great flowing stern: pearl
 * shells sweeping round a core of gold machinery, a pearl loop over it holding a glass dome, and a
 * fan of six long pods, each with a slot of blue-violet light down its flank, trailing light.
 */
function celestial(): ShipModel {
  const droop = (a: number) => new Matrix4().makeRotationX(a);
  // the manta wings off the bow: a leading edge bowed out to a point swept back, curving in again
  const wingEdge: P2[] = [[0.4, 0.06], ...bend([0.4, 0.06], [0.22, 0.2], [-0.02, 0.34], 12)];
  const wing: P2[] = [...wingEdge, ...bend([-0.02, 0.34], [0.06, 0.2], [0.0, 0.07], 10)];
  const underWing: P2[] = [[0.3, 0.06], ...bend([0.3, 0.06], [0.14, 0.18], [-0.06, 0.27], 10), ...bend([-0.06, 0.27], [0.0, 0.16], [-0.04, 0.06], 8)];
  // the stern's shells: crescents bowing out past the core, the upper broad, the lower wrapping under
  const shellEdge: P2[] = [[0.1, 0.06], ...bend([0.1, 0.06], [-0.1, 0.34], [-0.52, 0.22], 14)];
  const shell: P2[] = [...shellEdge, ...bend([-0.52, 0.22], [-0.3, 0.08], [0.02, 0.03], 12)];
  const lowerShell: P2[] = [[0.02, 0.07], ...bend([0.02, 0.07], [-0.16, 0.3], [-0.46, 0.2], 12), ...bend([-0.46, 0.2], [-0.24, 0.14], [-0.04, 0.05], 10)];
  // the loop over the stern, and the glass dome it holds
  const loopOuter = ellipse(-0.17, 0.22, 0.15);
  const loopInner = ellipse(-0.175, 0.16, 0.098);
  /**
   * A long, slender pod, its tail at `tail`, its nose turned `yaw` toward the keel so the fan opens
   * toward the stern: drawn fine at both ends, ringed in gold, a long oval of light in its flank.
   */
  const pod = (tail: Vec3, length: number, r: number, side: number, yaw: number): BufferGeometry[] => {
    const m = new Matrix4().makeRotationY(side * yaw).setPosition(...tail);
    const slot = new SphereGeometry(1, 24, 12).scale(length * 0.2, r * 0.5, r * 0.5);
    return [
      hull([[r * 0.6, 0], [r * 0.88, 0.03], [r, 0.11], [r, length * 0.5], [r * 0.82, length * 0.7], [r * 0.45, length * 0.88], [r * 0.12, length * 0.98], [0, length]], 28, PEARL, [0, 0, 0]),
      part(slot, GLOW, [length * 0.26, r * 0.42, side * r * 0.62]),
      part(new TorusGeometry(r * 1.02, 0.005, 6, 32).rotateY(Math.PI / 2), GOLD, [length * 0.5, 0, 0]),
      part(new TorusGeometry(r * 0.62, 0.006, 6, 32).rotateY(Math.PI / 2), GOLD, [0.002, 0, 0]),
      part(new CylinderGeometry(r * 0.58, r * 0.62, 0.02, 20), ENGINE, [0.006, 0, 0], ALONG_X),
    ].map((g) => g.applyMatrix4(m));
  };
  const pods: [Vec3, number, number, number][] = [
    // tail, length, radius, how far it fans out
    [[-0.74, 0.12, 0.1], 0.6, 0.05, 0.06],
    [[-0.68, 0.025, 0.26], 0.56, 0.046, 0.14],
    [[-0.7, -0.085, 0.15], 0.54, 0.044, 0.09],
  ];
  // the loop is raised toward the stern, as if swept back by speed
  const lift = new Matrix4().makeTranslation(-0.17, 0, 0).multiply(new Matrix4().makeRotationZ(-0.22)).multiply(new Matrix4().makeTranslation(0.17, 0, 0));
  const parts = [
    // the bow: flat, keeled and drawn to a fine point, a raised spine along its top
    hull([[0.0, -0.06], [0.13, 0.0], [0.135, 0.12], [0.11, 0.26], [0.075, 0.42], [0.04, 0.56], [0.014, 0.66], [0, 0.7]], 48, PEARL, [0.06, 0, 0], 0.4, 1, true),
    plate(sym([[0.62, 0], [0.4, 0.035], [0.1, 0.055], [-0.06, 0.05], [-0.06, 0]]), 0.03, PEARL, 0.07),
    // glass slits and warm lit windows along the bow
    part(new SphereGeometry(0.05, 20, 10).scale(1.2, 0.22, 0.4), GLASS, [0.42, 0.058, 0]),
    ...[0.3, 0.18].map((x) => part(new BoxGeometry(0.05, 0.006, 0.07), EMBER, [x, 0.072, 0])),
    // the gold core: ribbed machinery under the shells
    hull([[0, -0.66], [0.07, -0.64], [0.1, -0.58], [0.085, -0.54], [0.12, -0.5], [0.12, -0.42], [0.095, -0.39], [0.13, -0.34], [0.13, -0.22], [0.1, -0.19], [0.12, -0.14], [0.11, 0.02], [0.06, 0.08], [0, 0.1]], 32, GOLD, [0, 0.0, 0], 0.9, 1.25),
    ...[-0.56, -0.46, -0.36, -0.26, -0.16].map((x) => part(new TorusGeometry(0.12, 0.008, 6, 40).rotateY(Math.PI / 2).scale(1, 0.9, 1.25), GOLD, [x, 0, 0])),
    // the loop over the stern, rimmed in gold, holding a dome of gold machinery
    ring(loopOuter, loopInner, 0.02, PEARL, 0.13).applyMatrix4(lift),
    tube(loopOuter.map(([x, z]): Vec3 => [x, 0.133, z]), 0.005, GOLD, true).applyMatrix4(lift),
    tube(loopInner.map(([x, z]): Vec3 => [x, 0.133, z]), 0.004, GOLD, true).applyMatrix4(lift),
    part(new SphereGeometry(1, 32, 12).scale(0.165, 0.055, 0.1), GOLD, [-0.175, 0.1, 0]).applyMatrix4(lift),
    ...[[0.1, 0.06], [0.06, 0.036]].map(([a, b]) => part(new TorusGeometry(1, 0.06, 6, 40).rotateX(Math.PI / 2).scale(a, 0.08, b), GOLD, [-0.175, 0.14, 0]).applyMatrix4(lift)),
    part(new SphereGeometry(0.02, 16, 8), GLOW, [-0.175, 0.155, 0]).applyMatrix4(lift),
    ...[1, -1].flatMap((side) => {
      const s = (points: P2[]) => (side > 0 ? points : flipZ(points));
      return [
        // the manta wings, drooping, with a second, narrower layer beneath
        plate(s(wing), 0.016, PEARL, 0.0, true).applyMatrix4(droop(side * 0.32)),
        tube(wingEdge.map(([x, z]): Vec3 => [x, 0.002, side * z]), 0.005, GOLD).applyMatrix4(droop(side * 0.32)),
        plate(s(underWing), 0.014, PEARL, -0.03).applyMatrix4(droop(side * 0.55)),
        // gold trim down the bow's flanks
        tube([[0.72, 0.004, 0], [0.56, 0.018, side * 0.035], [0.34, 0.03, side * 0.07], [0.12, 0.036, side * 0.1], [-0.02, 0.03, side * 0.11]], 0.004, GOLD),
        // the stern's shells, wrapping down over the core
        plate(s(shell), 0.024, PEARL, 0.105, true).applyMatrix4(droop(side * 0.3)),
        tube(shellEdge.map(([x, z]): Vec3 => [x, 0.107, side * z]), 0.0055, GOLD).applyMatrix4(droop(side * 0.3)),
        plate(s(lowerShell), 0.02, PEARL, -0.02).applyMatrix4(droop(side * 0.95)),
        // gold machinery along the core's flanks, ribbed, showing between the shells and the pods
        part(new CylinderGeometry(0.03, 0.03, 0.36, 16), GOLD, [-0.36, 0.05, side * 0.17], ALONG_X),
        ...[-0.48, -0.4, -0.32, -0.24].map((x) => part(new TorusGeometry(0.034, 0.007, 6, 20).rotateY(Math.PI / 2), GOLD, [x, 0.05, side * 0.17])),
        // the fan of pods
        ...pods.flatMap(([tail, length, r, yaw]) => pod([tail[0], tail[1], side * tail[2]], length, r, side, yaw)),
      ];
    }),
  ];
  const nozzles = pods.flatMap(([tail]): Vec3[] => [[tail[0] - 0.01, tail[1], tail[2]], [tail[0] - 0.01, tail[1], -tail[2]]]);
  return { geometry: merge(parts), nozzles, glow: 0.7, size: 0.74, flame: [0.38, 0.45, 1.0] };
}

/**
 * Discovery, the experimental explorer (the owner's `Discovery Starship.png`, D-210): a long,
 * faceted cream fuselage behind a blunt gunmetal snout lit amber, a long dark canopy, bands of
 * gunmetal and orange livery, four round engine pods with glowing amber intakes (an upper pair
 * by the spine, a lower pair out on the wings), swept wings with turned-down tips, and two tall
 * swept fins.
 */
function discovery(): ShipModel {
  const wing: P2[] = [[0.1, 0.1], [-0.08, 0.34], [-0.3, 0.41], [-0.37, 0.39], [-0.3, 0.1]];
  const wingTip: P2[] = [[-0.2, 0.375], [-0.3, 0.41], [-0.37, 0.39], [-0.24, 0.36]];
  const wingPanel: P2[] = [[0.02, 0.15], [-0.08, 0.28], [-0.2, 0.3], [-0.2, 0.15]];
  /** A round engine pod, its tail at `tail`: cream, an orange band, a gunmetal lip round an amber intake. */
  const pod = (tail: Vec3): BufferGeometry[] => [
    hull([[0.046, 0], [0.06, 0.02], [0.068, 0.06], [0.07, 0.24], [0.066, 0.29], [0.062, 0.3]], 28, CREAM, tail),
    hull([[0.0725, 0.11], [0.0725, 0.19]], 28, ORANGE, tail),
    part(new TorusGeometry(0.062, 0.01, 8, 32).rotateY(Math.PI / 2), CHARCOAL, [tail[0] + 0.3, tail[1], tail[2]]),
    part(new CylinderGeometry(0.056, 0.056, 0.03, 28, 1, true), CHARCOAL, [tail[0] + 0.285, tail[1], tail[2]], ALONG_X),
    part(new CylinderGeometry(0.054, 0.054, 0.004, 28), EMBER, [tail[0] + 0.275, tail[1], tail[2]], ALONG_X),
    part(new CylinderGeometry(0.044, 0.048, 0.03, 24), FORGE, [tail[0] - 0.005, tail[1], tail[2]], ALONG_X),
  ];
  const upper: Vec3 = [-0.48, 0.055, 0.175];
  const lower: Vec3 = [-0.3, -0.06, 0.31];
  const parts = [
    // the fuselage: long and eight-sided, windowed, a gunmetal keel beneath
    prism([[0, -0.46], [0.1, -0.455], [0.125, -0.4], [0.13, -0.1], [0.13, 0.2], [0.132, 0.22]], 8, CREAM, [0, 0, 0], 0.75, 1, true),
    part(new BoxGeometry(0.56, 0.04, 0.13), CHARCOAL, [-0.12, -0.09, 0]),
    // the blunt, faceted snout in gunmetal, two amber lamps across its face and blue ones above
    prism([[0.136, 0], [0.136, 0.05], [0.122, 0.14], [0.1, 0.23], [0.075, 0.29], [0.052, 0.315], [0, 0.32]], 8, CHARCOAL, [0.2, 0, 0], 0.75, 1),
    ...[1, -1].flatMap((side) => [
      part(new BoxGeometry(0.012, 0.012, 0.045), EMBER, [0.505, -0.01, side * 0.03]),
      part(new BoxGeometry(0.03, 0.006, 0.01), BLUE, [0.42, 0.075, side * 0.06]),
    ]),
    // the long dark canopy, ribbed, over the front of the body
    part(new SphereGeometry(0.05, 28, 12).scale(3.2, 0.6, 0.85), GLASS, [0.22, 0.08, 0]),
    part(new BoxGeometry(0.3, 0.012, 0.008), CREAM, [0.21, 0.108, 0]),
    ...[0.13, 0.27].map((x) => part(new BoxGeometry(0.01, 0.012, 0.085), CHARCOAL, [x, 0.1, 0])),
    // gunmetal bands round the body
    ...[0.0, -0.22].map((x) => prism([[0.138, 0], [0.138, 0.04]], 8, CHARCOAL, [x, 0, 0], 0.75, 1)),
    // the spine behind the canopy: a cream module, banded, with orange livery on top
    part(new BoxGeometry(0.4, 0.05, 0.15), CREAM, [-0.2, 0.105, 0]),
    ...[-0.06, -0.33].map((x) => part(new BoxGeometry(0.04, 0.056, 0.156), CHARCOAL, [x, 0.106, 0])),
    plate(sym([[-0.1, 0], [-0.15, 0.06], [-0.27, 0.06], [-0.22, 0]]), 0.006, ORANGE, 0.134),
    // the stern block between the pods
    part(new BoxGeometry(0.03, 0.07, 0.12), CHARCOAL, [-0.465, 0.0, 0]),
    ...[1, -1].flatMap((side) => {
      const s = (points: P2[]) => (side > 0 ? points : flipZ(points));
      return [
        // orange livery down the flanks
        part(new BoxGeometry(0.18, 0.035, 0.006), ORANGE, [0.04, 0.005, side * 0.124]),
        part(new BoxGeometry(0.1, 0.035, 0.006), CHARCOAL, [-0.14, 0.005, side * 0.124]),
        // the wings: swept, an orange tip and a gunmetal panel, the tips turned down
        plate(s(wing), 0.02, CREAM, -0.07),
        plate(s(wingTip), 0.006, ORANGE, -0.066),
        plate(s(wingPanel), 0.006, CHARCOAL, -0.066),
        fin([[-0.24, -0.075], [-0.37, -0.075], [-0.41, -0.15], [-0.32, -0.15]], 0.016, CREAM, side * 0.4),
        // the pods: the upper pair on pylons beside the spine, the lower pair on the wings
        part(new BoxGeometry(0.2, 0.04, 0.08), CREAM, [-0.33, 0.045, side * 0.12]),
        ...pod([upper[0], upper[1], side * upper[2]]),
        ...pod([lower[0], lower[1], side * lower[2]]),
        // two tall swept fins, leaning a little outward, their tips orange
        fin([[-0.2, 0.12], [-0.39, 0.36], [-0.46, 0.37], [-0.44, 0.12]], 0.016, CREAM, side * 0.07, side * 0.12, 0.12),
        fin([[-0.33, 0.27], [-0.39, 0.36], [-0.46, 0.37], [-0.45, 0.27]], 0.02, ORANGE, side * 0.07, side * 0.12, 0.12),
      ];
    }),
  ];
  return {
    geometry: merge(parts),
    nozzles: [
      [upper[0] - 0.02, upper[1], upper[2]], [upper[0] - 0.02, upper[1], -upper[2]],
      [lower[0] - 0.02, lower[1], lower[2]], [lower[0] - 0.02, lower[1], -lower[2]],
    ],
    glow: 0.85,
    size: 0.86,
    flame: [1.0, 0.45, 0.1],
  };
}

/**
 * Colossus, the mobile expedition fortress (V2 sheet, refined in D-177): a long lens of four
 * stacked armoured decks, pointed at the bow and tapering toward the stern, chevrons of armour
 * down its spine (low and continuous on top: no tower), lit windows along every deck, bands of
 * blue light, armour blisters down its flanks, and its engines built into the stern.
 */
function colossus(): ShipModel {
  // a long lens of stacked armour, drawn to a point at the bow and tapering again toward the stern
  const base = sym([[0.92, 0], [0.62, 0.13], [0.22, 0.23], [-0.38, 0.25], [-0.7, 0.21], [-0.8, 0.13], [-0.8, 0]]);
  const middle = sym([[0.74, 0], [0.48, 0.11], [0.12, 0.19], [-0.4, 0.205], [-0.72, 0.16], [-0.76, 0]]);
  const upper = sym([[0.52, 0], [0.3, 0.085], [-0.02, 0.14], [-0.44, 0.15], [-0.7, 0.11], [-0.72, 0]]);
  const spine = sym([[0.3, 0], [0.1, 0.05], [-0.5, 0.075], [-0.68, 0]]);
  const keel = sym([[0.66, 0], [0.36, 0.13], [-0.44, 0.2], [-0.74, 0.12], [-0.76, 0]]);
  // a V of armour pointing forward: its tip, out and back along one arm, in to the notch
  const chevron = (x: number, w: number): P2[] => sym([[x + 0.1, 0], [x - 0.02, w], [x - 0.09, w], [x, 0]]);
  const parts = [
    plate(base, 0.05, STEEL, 0.0, true),
    plate(middle, 0.045, NAVY, 0.045, true),
    plate(upper, 0.035, STEEL, 0.085, true),
    plate(spine, 0.022, NAVY, 0.115),
    plate(keel, 0.045, NAVY, -0.05, true),
    // chevron armour down the spine, pointing forward, low and continuous: never a tower
    ...[0.2, 0.02, -0.16, -0.34, -0.52].map((x, i) => plate(chevron(x, 0.1 + 0.025 * Math.min(i, 2)), 0.016, i % 2 ? STEEL : SILVER, 0.135)),
    // the engine band across the stern, its four nozzles glowing
    part(new BoxGeometry(0.06, 0.1, 0.4), GUNMETAL, [-0.78, 0.02, 0]),
    ...[0.065, -0.065, 0.165, -0.165].map((z) => part(new CylinderGeometry(0.036, 0.036, 0.02, 20), GLOW, [-0.815, 0.02, z], ALONG_X)),
    ...[1, -1].flatMap((side) => [
      // armour blisters down the flanks, between bands of blue light
      ...[0.2, -0.02, -0.24, -0.46].map((x, i) => part(new BoxGeometry(0.18, 0.045, 0.035), STEEL, [x, -0.005, side * (0.232 + 0.012 * Math.min(i, 2))], undefined, true)),
      part(new BoxGeometry(0.9, 0.006, 0.006), BLUE, [-0.1, 0.05, side * 0.248]),
      part(new BoxGeometry(0.8, 0.006, 0.006), BLUE, [-0.14, 0.092, side * 0.205]),
      part(new BoxGeometry(0.6, 0.006, 0.006), BLUE, [-0.2, 0.125, side * 0.152]),
      // long glowing engine vents built into the stern quarters
      part(new BoxGeometry(0.16, 0.022, 0.012), GLOW, [-0.66, 0.02, side * 0.2]),
    ]),
  ];
  return {
    geometry: merge(parts),
    nozzles: [[-0.83, 0.02, 0.065], [-0.83, 0.02, -0.065], [-0.83, 0.02, 0.165], [-0.83, 0.02, -0.165]],
    glow: 1.0,
    size: 0.95,
  };
}

const BUILD: Record<ShipClass, () => ShipModel> = { sovereign, predator, celestial, discovery, colossus };

export function buildShip(ship: ShipClass): ShipModel {
  return BUILD[ship]();
}
