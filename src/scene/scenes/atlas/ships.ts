/**
 * The fleet (D-118): five original ships of our own, one per class the owner named, after the
 * roles in their reference sheet, not copies of any film or series design. Each is built from
 * simple solids, nose toward +x, about one unit long, with its engine nozzles listed for the
 * glows and trails (`start.ts`). Parts (`aPart`) pick the material in the start scene's shader:
 *
 *   0 pale metal   1 canopy glass   2 engine housing   3 gold   4 gunmetal
 *   5 blue light   6 red light      7 pearl white      8 orange paint
 */

import { BoxGeometry, BufferAttribute, ConeGeometry, CylinderGeometry, ExtrudeGeometry, Matrix4, Shape, SphereGeometry, TorusGeometry, type BufferGeometry } from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { ShipClass } from "@/lib/ship";

export type Vec3 = [number, number, number];

export interface ShipModel {
  geometry: BufferGeometry;
  /** Engine nozzles, in the ship's own frame (at most four). */
  nozzles: Vec3[];
  /** How wide each engine's glow is, relative to the original ship's. */
  glow: number;
}

const ALONG_X = new Matrix4().makeRotationZ(-Math.PI / 2); // cylinders and cones stand on y; lay them along x
const FLAT = new Matrix4().makeRotationX(Math.PI / 2); // extruded shapes lie in x-y; lay them in x-z

/** One part: plain positions and normals, which material it takes, moved into place. */
function part(geometry: BufferGeometry, which: number, at: Vec3, rotate?: Matrix4): BufferGeometry {
  let g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (g.getAttribute("uv")) g.deleteAttribute("uv");
  if (rotate) g = g.applyMatrix4(rotate);
  g.translate(at[0], at[1], at[2]);
  g.setAttribute("aPart", new BufferAttribute(new Float32Array(g.getAttribute("position").count).fill(which), 1));
  return g;
}

/** A flat plate from an outline in the x-z plane (x forward, z to the side). */
function plate(points: [number, number][], depth: number, which: number, y: number): BufferGeometry {
  const s = new Shape();
  s.moveTo(points[0][0], points[0][1]);
  for (const [x, z] of points.slice(1)) s.lineTo(x, z);
  return part(new ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: depth * 0.3, bevelSize: depth * 0.4, bevelSegments: 1 }), which, [0, y, 0], FLAT);
}

const mirror = (points: [number, number][]): [number, number][] => points.map(([x, z]) => [x, -z]);

function merge(parts: BufferGeometry[]): BufferGeometry {
  const ship = mergeGeometries(parts);
  if (!ship) throw new Error("ships: the parts did not merge");
  ship.computeBoundingSphere();
  return ship;
}

/** Sovereign, the elegant flagship: a long, flattened arrowhead hull, its engines hugging its flanks. */
function sovereign(): ShipModel {
  const parts = [
    part(new SphereGeometry(0.5, 28, 14).scale(1.15, 0.13, 0.55), 0, [0.12, 0.02, 0]), // the main hull
    part(new SphereGeometry(0.2, 20, 10).scale(1.9, 0.5, 0.75), 0, [-0.22, -0.03, 0]), // the keel below
    part(new SphereGeometry(0.06, 16, 10).scale(2.4, 0.7, 1.0), 1, [0.38, 0.07, 0]), // the bridge
    ...[1, -1].flatMap((side) => [
      part(new CylinderGeometry(0.045, 0.055, 0.62, 16), 2, [-0.2, 0.03, side * 0.24], ALONG_X),
      part(new BoxGeometry(0.5, 0.008, 0.012), 5, [-0.18, 0.08, side * 0.24]), // a light strip along each engine
      plate([[0.05, 0], [-0.3, side * 0.26], [-0.42, side * 0.26], [-0.32, 0]], 0.012, 0, 0.0), // swept pylons
    ]),
    plate([[-0.25, 0], [-0.48, 0.0], [-0.52, 0.004], [-0.3, 0.004]].map(([x, z]) => [x, z] as [number, number]), 0.01, 0, 0.06),
  ];
  return { geometry: merge(parts), nozzles: [[-0.52, 0.03, 0.24], [-0.52, 0.03, -0.24]], glow: 1 };
}

/** Predator, the intimidating cruiser: a narrow dark blade with two great scythe wings swept forward. */
function predator(): ShipModel {
  const scythe: [number, number][] = [
    [-0.25, 0.04], [-0.1, 0.3], [0.18, 0.5], [0.42, 0.56], [0.3, 0.46], [0.08, 0.32], [-0.05, 0.12], [-0.35, 0.05],
  ];
  const parts = [
    part(new ConeGeometry(0.09, 0.8, 6), 4, [0.18, 0, 0], ALONG_X), // the blade of the hull
    part(new BoxGeometry(0.42, 0.09, 0.16), 4, [-0.22, 0, 0]),
    part(new SphereGeometry(0.05, 12, 8).scale(2.0, 0.6, 0.8), 1, [0.12, 0.05, 0]),
    plate(scythe, 0.02, 4, -0.01),
    plate(mirror(scythe), 0.02, 4, -0.01),
    part(new BoxGeometry(0.36, 0.01, 0.01), 6, [0.0, 0.05, 0]), // a red seam along the spine
    ...[1, -1].map((side) => part(new BoxGeometry(0.02, 0.01, 0.3), 6, [0.2, 0.0, side * 0.36])), // glints on the wings
    ...[1, -1].map((side) => part(new CylinderGeometry(0.045, 0.05, 0.22, 12), 2, [-0.46, 0, side * 0.06], ALONG_X)),
  ];
  return { geometry: merge(parts), nozzles: [[-0.57, 0, 0.06], [-0.57, 0, -0.06]], glow: 0.9 };
}

/** Celestial, the legendary vessel: a pearl teardrop wrapped in sweeping arcs of gold. */
function celestial(): ShipModel {
  const tiltRing = new Matrix4().makeRotationX(Math.PI / 2).multiply(new Matrix4().makeRotationZ(0.4));
  const parts = [
    part(new SphereGeometry(0.5, 28, 16).scale(1.2, 0.16, 0.34), 7, [0.05, 0, 0]), // the pearl hull
    part(new SphereGeometry(0.07, 16, 10).scale(2.2, 0.8, 1.2), 1, [0.25, 0.07, 0]),
    part(new TorusGeometry(0.3, 0.022, 10, 48, Math.PI * 1.35), 3, [-0.08, 0.02, 0], tiltRing), // the great gold arc
    part(new TorusGeometry(0.22, 0.016, 8, 40, Math.PI * 1.2), 3, [-0.18, -0.02, 0], new Matrix4().makeRotationX(Math.PI / 2).multiply(new Matrix4().makeRotationZ(2.6))),
    ...[1, -1].flatMap((side) => [
      plate([[0.0, side * 0.12], [-0.38, side * 0.4], [-0.46, side * 0.38], [-0.3, side * 0.1]], 0.012, 7, -0.01),
      part(new BoxGeometry(0.3, 0.012, 0.014), 3, [-0.18, 0.0, side * 0.27]), // gold trim along the wings
      part(new CylinderGeometry(0.04, 0.05, 0.26, 16), 3, [-0.52, 0, side * 0.1], ALONG_X),
    ]),
  ];
  return { geometry: merge(parts), nozzles: [[-0.65, 0, 0.1], [-0.65, 0, -0.1]], glow: 1 };
}

/** Discovery, the experimental explorer: a chunky, modular hull with big round orange engines. */
function discovery(): ShipModel {
  const parts = [
    part(new BoxGeometry(0.56, 0.16, 0.24), 0, [-0.02, 0, 0]), // the main module
    part(new BoxGeometry(0.3, 0.1, 0.2), 0, [-0.2, 0.12, 0]), // the upper module
    part(new ConeGeometry(0.17, 0.3, 4), 0, [0.4, -0.01, 0], ALONG_X.clone().multiply(new Matrix4().makeRotationY(Math.PI / 4))), // a wedge nose
    part(new BoxGeometry(0.16, 0.05, 0.18), 1, [0.24, 0.08, 0]), // the canopy band
    part(new BoxGeometry(0.5, 0.012, 0.25), 8, [-0.04, 0.085, 0]), // an orange stripe over the top
    ...[1, -1].flatMap((side) => [
      part(new CylinderGeometry(0.08, 0.085, 0.34, 18), 8, [-0.22, -0.02, side * 0.2], ALONG_X), // the round engines
      part(new CylinderGeometry(0.06, 0.06, 0.06, 18), 2, [-0.41, -0.02, side * 0.2], ALONG_X),
      plate([[-0.1, side * 0.1], [-0.34, side * 0.42], [-0.42, side * 0.42], [-0.32, side * 0.1]], 0.014, 0, -0.06), // the wings
      part(new BoxGeometry(0.16, 0.16, 0.012), 8, [-0.3, 0.18, side * 0.07]), // tall tail fins
    ]),
  ];
  return { geometry: merge(parts), nozzles: [[-0.45, -0.02, 0.2], [-0.45, -0.02, -0.2]], glow: 1.5 };
}

/** Colossus, the mobile expedition fortress: a long slab of stacked decks, lit along its length. */
function colossus(): ShipModel {
  const parts = [
    part(new BoxGeometry(0.95, 0.09, 0.3), 4, [0, 0, 0]),
    part(new BoxGeometry(0.75, 0.07, 0.24), 0, [-0.04, 0.075, 0]),
    part(new BoxGeometry(0.46, 0.06, 0.16), 4, [-0.1, 0.14, 0]),
    part(new BoxGeometry(0.1, 0.05, 0.06), 1, [0.12, 0.19, 0]), // the command tower
    part(new ConeGeometry(0.2, 0.3, 4), 4, [0.6, 0.01, 0], ALONG_X.clone().multiply(new Matrix4().makeRotationY(Math.PI / 4)).multiply(new Matrix4().makeScale(1, 1, 0.5))), // the prow
    part(new BoxGeometry(0.8, 0.07, 0.36), 0, [-0.05, -0.07, 0]), // the lower deck
    ...[1, -1].flatMap((side) => [
      part(new BoxGeometry(0.8, 0.008, 0.008), 5, [-0.02, 0.01, side * 0.152]), // rows of lights
      part(new BoxGeometry(0.62, 0.006, 0.006), 5, [-0.04, 0.08, side * 0.122]),
      part(new BoxGeometry(0.7, 0.006, 0.006), 5, [-0.05, -0.06, side * 0.182]),
    ]),
    ...[
      [0.06, 0.1],
      [0.06, -0.1],
      [-0.06, 0.1],
      [-0.06, -0.1],
    ].map(([y, z]) => part(new CylinderGeometry(0.04, 0.045, 0.12, 12), 2, [-0.52, y, z], ALONG_X)),
  ];
  return {
    geometry: merge(parts),
    nozzles: [
      [-0.58, 0.06, 0.1],
      [-0.58, 0.06, -0.1],
      [-0.58, -0.06, 0.1],
      [-0.58, -0.06, -0.1],
    ],
    glow: 0.8,
  };
}

const BUILD: Record<ShipClass, () => ShipModel> = { sovereign, predator, celestial, discovery, colossus };

export function buildShip(ship: ShipClass): ShipModel {
  return BUILD[ship]();
}
