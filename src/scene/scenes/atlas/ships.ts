/**
 * The fleet (D-118, redesigned in D-120 after the owner's brief, `docs/SHIP_BRIEF.md`): five
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
 */

import {
  BoxGeometry,
  BufferAttribute,
  CatmullRomCurve3,
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
}

/** Material ids (see the header). */
const SILVER = 0, GLASS = 1, ENGINE = 2, GOLD = 3, GUNMETAL = 4, BLUE = 5, RED = 6, PEARL = 7, PAINT = 8, WHITE = 9, STEEL = 10, NAVY = 11, GRAPHITE = 12, GLOW = 13;

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
 * Predator, the intimidating cruiser (V1 sheet): a long, flat, layered blade of graphite, broad
 * wings with curved leading edges drooping a little toward engine pods at their tips, small
 * canards forward, blue seams and engines.
 */
function predator(): ShipModel {
  const base = sym([[0.64, 0], [0.4, 0.045], [0.12, 0.09], [-0.3, 0.125], [-0.5, 0.12], [-0.56, 0.07], [-0.56, 0]]);
  const deck = sym([[0.42, 0], [0.2, 0.04], [-0.15, 0.07], [-0.42, 0.072], [-0.47, 0]]);
  const spine = sym([[0.22, 0], [0.0, 0.022], [-0.36, 0.028], [-0.4, 0]]);
  const keel = sym([[0.46, 0], [0.1, 0.07], [-0.45, 0.09], [-0.5, 0]]);
  // one wing: a curved leading edge out to the tip, a curved trailing edge back to the root
  const wing: P2[] = [[0.06, 0.09], ...bend([0.06, 0.09], [-0.06, 0.3], [-0.36, 0.5], 10), [-0.47, 0.49], ...bend([-0.47, 0.49], [-0.36, 0.26], [-0.44, 0.11], 8)];
  const canard: P2[] = [[0.34, 0.045], [0.22, 0.17], [0.17, 0.17], [0.2, 0.06]];
  const droop = (side: number) => new Matrix4().makeRotationX(side * 0.09);
  const parts = [
    plate(base, 0.04, GRAPHITE, 0.0, true),
    plate(deck, 0.03, GUNMETAL, 0.035),
    plate(spine, 0.022, GRAPHITE, 0.06),
    plate(keel, 0.03, GRAPHITE, -0.04),
    // a glass slit far back on the deck, never a fighter's cockpit
    part(new BoxGeometry(0.08, 0.008, 0.03), GLASS, [-0.18, 0.065, 0]),
    ...[1, -1].flatMap((side) => [
      plate(side > 0 ? wing : flipZ(wing), 0.022, GRAPHITE, -0.004).applyMatrix4(droop(side)),
      plate(side > 0 ? canard : flipZ(canard), 0.014, GUNMETAL, 0.01),
      // blue seams along the deck's edges and the wing roots
      part(new BoxGeometry(0.5, 0.006, 0.006), BLUE, [-0.05, 0.04, side * 0.06]),
      part(new BoxGeometry(0.3, 0.005, 0.006), BLUE, [-0.22, 0.005, side * 0.15]),
      // the wingtip pods and the two main engines at the stern
      hull([[0, 0], [0.026, 0.01], [0.03, 0.06], [0.03, 0.3], [0.018, 0.36], [0, 0.37]], 16, GUNMETAL, [-0.6, -0.045, side * 0.49]),
      part(new CylinderGeometry(0.036, 0.04, 0.12, 16), ENGINE, [-0.53, 0.0, side * 0.06], ALONG_X),
      // a red light at each wingtip
      part(new BoxGeometry(0.012, 0.008, 0.012), RED, [-0.27, -0.01, side * 0.5]),
    ]),
  ];
  return {
    geometry: merge(parts),
    nozzles: [[-0.6, -0.045, 0.49], [-0.6, -0.045, -0.49], [-0.6, 0, 0.06], [-0.6, 0, -0.06]],
    glow: 0.7,
    size: 0.86,
  };
}

/**
 * Celestial, the legendary vessel (V2 sheet and Celestial.jpg): a long pearl hull drawn to a fine
 * point, a glass streak along its back, two sets of crescent blades sweeping back, gold trim on
 * every edge, and a gold halo ringing its stern.
 */
function celestial(): ShipModel {
  const bladeEdge: P2[] = [[0.16, 0.06], ...bend([0.16, 0.06], [0.02, 0.33], [-0.52, 0.43], 12)];
  const upperEdge: P2[] = [[0.02, 0.05], ...bend([0.02, 0.05], [-0.12, 0.2], [-0.46, 0.26], 10)];
  const blade: P2[] = [...bladeEdge, ...bend([-0.52, 0.43], [-0.22, 0.2], [-0.32, 0.07], 10)];
  const upper: P2[] = [...upperEdge, ...bend([-0.46, 0.26], [-0.26, 0.12], [-0.34, 0.04], 8)];
  const parts = [
    hull([[0, -0.58], [0.04, -0.56], [0.075, -0.46], [0.1, -0.3], [0.11, -0.12], [0.1, 0.06], [0.08, 0.23], [0.05, 0.41], [0.022, 0.55], [0, 0.64]], 48, PEARL, [0, 0, 0], 0.55, 1, true),
    part(new SphereGeometry(0.05, 24, 12).scale(3.4, 0.38, 0.75), GLASS, [0.16, 0.05, 0]),
    // the gold halo round the stern, and a gold keel line
    part(new TorusGeometry(0.17, 0.011, 8, 72).rotateX(Math.PI / 2).scale(1.35, 1, 1), GOLD, [-0.3, 0.005, 0]),
    tube([[0.5, 0.012, 0], [0.2, 0.06, 0], [-0.1, 0.064, 0], [-0.45, 0.04, 0]], 0.006, GOLD),
    ...[1, -1].flatMap((side) => {
      const s = (points: P2[]) => (side > 0 ? points : flipZ(points));
      return [
        plate(s(blade), 0.016, PEARL, -0.008),
        plate(s(upper), 0.014, PEARL, 0.03),
        // gold along each blade's leading edge (the same curves) and down the hull's flanks
        tube(bladeEdge.map(([x, z]): Vec3 => [x, -0.006, side * z]), 0.007, GOLD),
        tube(upperEdge.map(([x, z]): Vec3 => [x, 0.028, side * z]), 0.006, GOLD),
        tube([[0.52, 0.006, side * 0.03], [0.3, 0.014, side * 0.07], [0.05, 0.016, side * 0.1], [-0.25, 0.012, side * 0.1], [-0.52, 0.004, side * 0.055]], 0.005, GOLD),
        // engines cased in gold at the stern
        part(new CylinderGeometry(0.026, 0.032, 0.14, 20), GOLD, [-0.53, 0, side * 0.07], ALONG_X),
      ];
    }),
  ];
  return { geometry: merge(parts), nozzles: [[-0.61, 0, 0.07], [-0.61, 0, -0.07]], glow: 0.75, size: 0.88 };
}

/**
 * Discovery, the experimental explorer (Discovery.jpg, recoloured white, silver and blue): a
 * chunky shuttle body behind a dark wedge nose, two big round engine pods, narrow swept wings and
 * twin tall fins leaning outward.
 */
function discovery(): ShipModel {
  const wing: P2[] = [[-0.06, 0.11], [-0.32, 0.33], [-0.4, 0.33], [-0.34, 0.11]];
  const parts = [
    // the wedge nose in bare steel, its glass band on the slope
    fin([[0.62, -0.03], [0.44, 0.065], [0.22, 0.085], [0.22, -0.075], [0.54, -0.065]], 0.19, STEEL, 0),
    part(new SphereGeometry(0.06, 20, 10).scale(1.9, 0.3, 1.3), GLASS, [0.38, 0.065, 0], new Matrix4().makeRotationZ(-0.36)),
    // the long body, its upper module and a rear module
    part(new BoxGeometry(0.6, 0.16, 0.22), WHITE, [-0.08, 0, 0], undefined, true),
    part(new BoxGeometry(0.42, 0.07, 0.16), WHITE, [-0.1, 0.115, 0]),
    part(new BoxGeometry(0.36, 0.006, 0.06), PAINT, [-0.1, 0.152, 0]),
    part(new BoxGeometry(0.1, 0.12, 0.18), SILVER, [-0.43, 0.01, 0]),
    ...[1, -1].flatMap((side) => [
      // blue panels on the flanks
      part(new BoxGeometry(0.26, 0.06, 0.008), PAINT, [0.02, 0.02, side * 0.112]),
      plate(side > 0 ? wing : flipZ(wing), 0.014, WHITE, -0.06),
      // the round engine pods on short pylons, rimmed dark at the back
      hull([[0.056, 0], [0.07, 0.02], [0.074, 0.06], [0.074, 0.26], [0.058, 0.33], [0.03, 0.35], [0, 0.355]], 28, PAINT, [-0.5, -0.02, side * 0.18]),
      part(new CylinderGeometry(0.058, 0.058, 0.03, 24, 1, true), ENGINE, [-0.505, -0.02, side * 0.18], ALONG_X),
      part(new BoxGeometry(0.2, 0.03, 0.07), SILVER, [-0.3, -0.02, side * 0.13]),
      // twin fins leaning outward, blue at the tips
      fin([[-0.25, 0.14], [-0.42, 0.32], [-0.48, 0.32], [-0.45, 0.14]], 0.014, WHITE, side * 0.075, side * 0.28, 0.14),
      fin([[-0.4, 0.28], [-0.42, 0.32], [-0.48, 0.32], [-0.47, 0.28]], 0.018, PAINT, side * 0.075, side * 0.28, 0.14),
    ]),
  ];
  return { geometry: merge(parts), nozzles: [[-0.52, -0.02, 0.18], [-0.52, -0.02, -0.18]], glow: 1.2, size: 0.86 };
}

/**
 * Colossus, the mobile expedition fortress (V2 sheet): a long, broad stack of armoured decks with
 * a chisel prow, low and continuous on top (no tower), lit windows along every deck, armour
 * blisters down its flanks, and its engines built into one wide band across the stern.
 */
function colossus(): ShipModel {
  const base = sym([[0.84, 0], [0.58, 0.15], [0.26, 0.235], [-0.62, 0.255], [-0.75, 0.225], [-0.77, 0]]);
  const middle = sym([[0.64, 0], [0.44, 0.125], [0.16, 0.185], [-0.66, 0.195], [-0.74, 0]]);
  const spine = sym([[0.44, 0], [0.28, 0.07], [-0.66, 0.08], [-0.7, 0]]);
  const keel = sym([[0.58, 0], [0.34, 0.14], [-0.56, 0.2], [-0.72, 0]]);
  // the top: a row of armoured blocks down the spine, low and separate, never a tower
  const blocks: [number, number, number, number][] = [
    // x, length, width, height
    [0.3, 0.16, 0.16, 0.03],
    [0.1, 0.18, 0.24, 0.04],
    [-0.12, 0.18, 0.27, 0.045],
    [-0.34, 0.18, 0.27, 0.045],
    [-0.55, 0.16, 0.25, 0.04],
  ];
  const parts = [
    plate(base, 0.06, STEEL, 0.0, true),
    plate(middle, 0.05, NAVY, 0.05, true),
    plate(spine, 0.02, NAVY, 0.075),
    plate(keel, 0.045, NAVY, -0.055, true),
    ...blocks.map(([x, length, width, height], i) => part(new BoxGeometry(length, height, width), i % 2 ? NAVY : STEEL, [x, 0.075 + height / 2, 0], undefined, true)),
    // the engine band across the stern, its four nozzles glowing
    part(new BoxGeometry(0.05, 0.085, 0.44), GUNMETAL, [-0.76, 0.0, 0]),
    ...[0.07, -0.07, 0.18, -0.18].map((z) => part(new CylinderGeometry(0.034, 0.034, 0.02, 20), GLOW, [-0.79, 0, z], ALONG_X)),
    ...[1, -1].flatMap((side) => [
      // armour blisters down the flanks
      ...[0.12, -0.12, -0.36, -0.58].map((x) => part(new BoxGeometry(0.17, 0.05, 0.04), STEEL, [x, -0.005, side * 0.252], undefined, true)),
      // blue light along the deck edges
      part(new BoxGeometry(1.0, 0.006, 0.006), BLUE, [-0.14, 0.028, side * 0.255]),
      part(new BoxGeometry(0.8, 0.006, 0.006), BLUE, [-0.22, 0.073, side * 0.19]),
    ]),
  ];
  return {
    geometry: merge(parts),
    nozzles: [[-0.8, 0.0, 0.07], [-0.8, 0.0, -0.07], [-0.8, 0.0, 0.18], [-0.8, 0.0, -0.18]],
    glow: 1.0,
    size: 0.95,
  };
}

const BUILD: Record<ShipClass, () => ShipModel> = { sovereign, predator, celestial, discovery, colossus };

export function buildShip(ship: ShipClass): ShipModel {
  return BUILD[ship]();
}
