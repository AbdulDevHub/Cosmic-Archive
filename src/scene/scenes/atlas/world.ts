/**
 * The atlas's three.js objects, built from `model.ts` (ARCHITECTURE.md 4): Level 1, the galaxy,
 * and Level 2, the cosmic web, cross-faded by the one zoom scalar.
 *
 * Layers in draw order: wash and stars; body, haze, halo, companion, and the web; the disc (and
 * the bulge on `low`); dust; core; ink; trail; vessel. All additive except dust, so only dust
 * depends on order. A layer whose strength is zero is not drawn at all.
 *
 * Each frame also tells the DOM where its named places are on screen (`ANCHORS`), so beacons can
 * be real links laid over the canvas.
 *
 * Production replacements for the prototype's shortcuts (DESIGN_SPEC.md section 10):
 * - large glow sprites are instanced quads, not gl.POINTS;
 * - ink is drawn with constant-width screen-space lines, one canvas pixel wide.
 */

import {
  AddEquation,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  CustomBlending,
  DoubleSide,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Mesh,
  MeshBasicMaterial,
  OneFactor,
  OneMinusSrcColorFactor,
  Points,
  ShaderMaterial,
  Vector2,
  Vector3,
  ZeroFactor,
  type Material,
  type Object3D,
  type PerspectiveCamera,
} from "three";
import { Line2 } from "three/addons/lines/Line2.js";
import { LineGeometry } from "three/addons/lines/LineGeometry.js";
import { LineMaterial } from "three/addons/lines/LineMaterial.js";
import { LineSegments2 } from "three/addons/lines/LineSegments2.js";
import { LineSegmentsGeometry } from "three/addons/lines/LineSegmentsGeometry.js";
import type { SceneFrame, SceneInput } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { POINT_FRAGMENT, POINT_VERTEX, SPRITE_FRAGMENT, SPRITE_VERTEX } from "../../shaders/points.glsl";
import { isPhone, placeCamera } from "./camera";
import { armAngle, buildAtlas, C, COUNTS, discBrightness, mix, OUTER, RING, SATELLITE, SPIN, sstep, TAU, type Cloud, type Vec3 } from "./model";

// base strengths, faded out together at the far zoom
const A = { haze: 0.05, body: 0.02, dust: 0.1, core: 0.22, halo: 0.8 };
const ORDER_INK = 6;

/**
 * The places a beacon can stand. `content/destinations.ts` names one per destination; the scene
 * owns where each one is, because that depends on the galaxy as generated and on the composition.
 */
const NEBULA_R = 0.74;
const NEBULA_TH = armAngle(1, NEBULA_R);
// a dark lane on the inner edge of the other main arm, as model.ts `buildDust` lays them
const DUST_R = 0.5;
const DUST_TH = armAngle(0, DUST_R);
const DUST_RR = DUST_R - (0.03 + 0.05 * DUST_R);
type Anchor = { local: Vec3; spin: boolean } | { web: "quasar" | "home" };
const ANCHORS: Record<string, Anchor> = {
  /** The heart of the galaxy. */
  core: { local: [0, 0, 0], spin: false },
  /** A place in one of the main arms; it turns with the disc. */
  arm: { local: [NEBULA_R * Math.cos(NEBULA_TH), 0, NEBULA_R * Math.sin(NEBULA_TH)], spin: true },
  /** On the ticked ring: stands for the galaxy as a whole. */
  ring: { local: [RING * Math.cos(-1.0), 0, RING * Math.sin(-1.0)], spin: false },
  /** A far galaxy of the web, placed where the zoomed-out composition wants it. */
  quasar: { web: "quasar" },
  /** The galaxy the visitor came from. */
  home: { web: "home" },
  /** A dust lane along the inside of a main arm; it turns with the disc (the Galaxies page). */
  dust: { local: [DUST_RR * Math.cos(DUST_TH), 0, DUST_RR * Math.sin(DUST_TH)], spin: true },
  /** The dwarf companion (the Galaxies page). */
  companion: { local: [SATELLITE[0], SATELLITE[1], SATELLITE[2]], spin: false },
};

/** Where the quasar's beacon should fall in the zoomed-out view, in NDC (the prototype's). */
const QUASAR_WANT = { wide: [0.4, -0.38], narrow: [0.42, 0.55] } as const;

export function makeFrame(): SceneFrame {
  const points: SceneFrame["points"] = {};
  for (const name of Object.keys(ANCHORS)) points[name] = { x: 0, y: 0, on: false };
  return { zoom: 0, width: 1, height: 1, narrow: false, points, radius: 1, shade: () => 0 };
}

interface LayerOptions {
  spin?: number;
  twinkle?: number;
  maxPx?: number;
  atten?: number;
  alpha?: number;
  soft?: number;
  order?: number;
  dust?: boolean;
}

/** One cloud of soft discs, drawn as points or as instanced quads. */
class Layer {
  readonly object: Points | Mesh;
  readonly material: ShaderMaterial;
  private readonly maxPx: number;
  private readonly atten: number;

  constructor(
    private readonly cloud: Cloud,
    readonly sprite: boolean,
    o: LayerOptions,
  ) {
    this.maxPx = o.maxPx ?? 64;
    this.atten = o.atten ?? 1;
    this.material = new ShaderMaterial({
      vertexShader: sprite ? SPRITE_VERTEX : POINT_VERTEX,
      fragmentShader: sprite ? SPRITE_FRAGMENT : POINT_FRAGMENT,
      uniforms: {
        uTime: { value: 0 },
        uPx: { value: 1 },
        uSpin: { value: o.spin ?? 0 },
        uTwinkle: { value: o.twinkle ?? 0 },
        uMaxPx: { value: this.maxPx },
        uAtten: { value: this.atten },
        uAlpha: { value: o.alpha ?? 1 },
        uSoft: { value: o.soft ?? 1.6 },
        uViewport: { value: new Vector2(1, 1) },
      },
      transparent: true,
      depthWrite: false,
      depthTest: false,
      blending: AdditiveBlending,
    });
    if (o.dust) {
      // dust darkens what is behind it: result = behind * (1 - colour)
      this.material.blending = CustomBlending;
      this.material.blendEquation = AddEquation;
      this.material.blendSrc = ZeroFactor;
      this.material.blendDst = OneMinusSrcColorFactor;
      // leave the canvas alpha alone: without this the lanes punch transparent holes in the stills
      this.material.blendSrcAlpha = ZeroFactor;
      this.material.blendDstAlpha = OneFactor;
    }

    const n = cloud.n;
    if (sprite) {
      const g = new InstancedBufferGeometry();
      g.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 1, -1, 0, 1, 1, 0, -1, 1, 0]), 3));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.setAttribute("iPos", new InstancedBufferAttribute(cloud.pos.subarray(0, n * 3), 3));
      g.setAttribute("iColor", new InstancedBufferAttribute(cloud.col.subarray(0, n * 3), 3));
      g.setAttribute("iSize", new InstancedBufferAttribute(cloud.size.subarray(0, n), 1));
      g.setAttribute("iSeed", new InstancedBufferAttribute(cloud.seed.subarray(0, n), 1));
      g.instanceCount = n;
      this.object = new Mesh(g, this.material);
    } else {
      const g = new BufferGeometry();
      g.setAttribute("position", new BufferAttribute(cloud.pos.subarray(0, n * 3), 3));
      g.setAttribute("aColor", new BufferAttribute(cloud.col.subarray(0, n * 3), 3));
      g.setAttribute("aSize", new BufferAttribute(cloud.size.subarray(0, n), 1));
      g.setAttribute("aSeed", new BufferAttribute(cloud.seed.subarray(0, n), 1));
      this.object = new Points(g, this.material);
    }
    this.object.frustumCulled = false;
    this.object.renderOrder = o.order ?? 1;
  }

  /** Strength of the whole layer. At zero it is not drawn: no draw call, no vertex work. */
  set alpha(value: number) {
    this.material.uniforms.uAlpha.value = value;
    this.object.visible = value > 0.0005;
  }

  set time(value: number) {
    this.material.uniforms.uTime.value = value;
  }

  /** Draw only part of the instances: the governor's last step halves the glow. */
  set fraction(value: number) {
    if (this.sprite) (this.object.geometry as InstancedBufferGeometry).instanceCount = Math.max(1, Math.round(this.cloud.n * value));
  }

  resize(px: number, dpr: number, bufferWidth: number, bufferHeight: number): void {
    const u = this.material.uniforms;
    u.uPx.value = this.atten ? px : dpr;
    u.uMaxPx.value = this.maxPx * dpr;
    (u.uViewport.value as Vector2).set(bufferWidth, bufferHeight);
  }
}

// ---------- the ink ----------
const INK = new Color(0xf4eee2);
const GOLD = new Color(0xf5c56b);

function inkMaterial(opacity: number): LineMaterial {
  const m = new LineMaterial({ color: INK, linewidth: 1, transparent: true, opacity, depthTest: false, depthWrite: false });
  m.userData.base = opacity;
  return m;
}

function ring(r: number, opacity: number): Line2 {
  const pts: number[] = [];
  for (let i = 0; i <= 360; i++) {
    const a = (i / 360) * TAU;
    pts.push(r * Math.cos(a), 0, r * Math.sin(a));
  }
  return new Line2(new LineGeometry().setPositions(pts), inkMaterial(opacity));
}

function ticks(r: number, opacity: number): LineSegments2 {
  const pts: number[] = [];
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const len = i % 6 === 0 ? 0.075 : 0.03;
    pts.push(r * Math.cos(a), 0, r * Math.sin(a), (r + len) * Math.cos(a), 0, (r + len) * Math.sin(a));
  }
  return new LineSegments2(new LineSegmentsGeometry().setPositions(pts), inkMaterial(opacity));
}

function axis(opacity: number): LineSegments2 {
  // prettier-ignore
  const pts = [
    -OUTER, 0, 0, -0.3, 0, 0, 0.3, 0, 0, OUTER, 0, 0,
    -OUTER, 0, -0.04, -OUTER, 0, 0.04, OUTER, 0, -0.04, OUTER, 0, 0.04,
  ];
  return new LineSegments2(new LineSegmentsGeometry().setPositions(pts), inkMaterial(opacity));
}

function single(color: readonly [number, number, number], size: number): Cloud {
  return { pos: new Float32Array(3), col: new Float32Array(color), size: new Float32Array([size]), seed: new Float32Array(1), n: 1 };
}

export class AtlasWorld {
  readonly root = new Group();
  private readonly galaxy = new Group();
  private readonly layers: Layer[];
  private readonly glowLayers: Layer[];
  private readonly wash: Layer;
  private readonly stars: Layer;
  private readonly body: Layer;
  private readonly haze: Layer;
  private readonly halo: Layer;
  private readonly companionStars: Layer;
  private readonly companionGlow: Layer;
  private readonly dust: Layer;
  private readonly core: Layer;
  private readonly engine: Layer;
  private readonly discLayers: Layer[];
  private readonly web: Layer;
  private readonly webGlow: Layer;
  private readonly homeDot: Layer;
  private readonly quasarDot: Layer;
  private readonly webNodes: Vec3[];
  private readonly quasar = new Vector3();
  private readonly scratch = [new Vector3(), new Vector3(), new Vector3()];
  private camera: PerspectiveCamera | null = null;
  private time = 0;
  private zoom = 0;
  private width = 1;
  private height = 1;
  private readonly ink: Array<Line2 | LineSegments2>;
  private readonly trail: Line2;
  private readonly trailMaterial: LineMaterial;
  private readonly vessel: Mesh<BufferGeometry, MeshBasicMaterial>;
  /** Strengths of the glow layers for this tier; see the constructor. */
  private readonly glow: { body: number; haze: number; dust: number };
  private glowGain = 1;

  /**
   * `subject`: the Galaxies page. The galaxy is framed whole by its own camera key, the zoom is
   * held at the galaxy, and the vessel and its trail stay on the homepage, where the journey is.
   */
  constructor(
    tier: ParticleTier,
    narrow: boolean,
    private readonly subject = false,
  ) {
    const data = buildAtlas(tier, narrow);
    const counts = COUNTS[tier];
    // On a wide screen the galaxy fills the frame, so a lower tier must not look thinner: fewer
    // sprites each carry more, and the total light stays what the owner approved at the `high`
    // counts. The phone composition keeps the prototype's own phone strengths.
    const top = COUNTS.high;
    const carry = (key: "body" | "haze" | "dust") => (narrow ? 1 : top[key] / counts[key]);
    // dust only part of the way: at full strength the few lanes left read as blots
    this.glow = { body: A.body * carry("body"), haze: A.haze * carry("haze"), dust: A.dust * Math.sqrt(carry("dust")) };
    const discAlpha = narrow ? counts.discAlpha : counts.discAlphaWide;

    this.wash = new Layer(data.wash, true, { atten: 0, alpha: 0.07, maxPx: 1024, soft: 2.2, order: 0 });
    this.stars = new Layer(data.stars, false, { atten: 0, twinkle: 0.35, maxPx: 8, alpha: 1.0, soft: 1.3, order: 0 });
    this.body = new Layer(data.body, true, { spin: SPIN, alpha: this.glow.body, soft: 2.0, maxPx: 1024, order: 1 });
    this.haze = new Layer(data.haze, true, { spin: SPIN, alpha: this.glow.haze, soft: 2.0, maxPx: 1024, order: 1 });
    this.halo = new Layer(data.halo, false, { spin: SPIN, twinkle: 0.2, alpha: A.halo, maxPx: 12, order: 1 });
    this.companionStars = new Layer(data.companionStars, false, { twinkle: 0.2, alpha: A.halo, maxPx: 1024, order: 1 });
    this.companionGlow = new Layer(data.companionGlow, true, { twinkle: 0.2, alpha: A.halo, maxPx: 1024, order: 1 });
    // fewer points carry more light each
    const disc = new Layer(data.disc, false, { spin: SPIN, twinkle: 0.15, alpha: discAlpha, maxPx: 40, order: 2 });
    this.dust = new Layer(data.dust, true, { spin: SPIN, alpha: this.glow.dust, soft: 1.8, maxPx: 1024, dust: true, order: 3 });
    this.core = new Layer(data.core, true, { alpha: A.core, soft: 3.2, maxPx: 1024, order: 4 });
    this.engine = new Layer(single(C.gold, 10), false, { atten: 0, alpha: 0.9, maxPx: 16, soft: 2.4, order: ORDER_INK + 2 });

    // Level 2. Nothing of it is drawn until the zoom reaches it.
    this.webNodes = data.webNodes;
    this.webGlow = new Layer(data.webGlow, true, { alpha: 0, maxPx: 1024, soft: 2.0, order: 1 });
    this.web = new Layer(data.web, false, { alpha: 0, twinkle: 0.1, maxPx: 12, soft: 1.4, order: 1 });
    this.homeDot = new Layer(single(C.gold, 9), false, { atten: 0, alpha: 0, maxPx: 12, soft: 2.2, order: 1 });
    this.quasarDot = new Layer(single([0.85, 0.94, 1.0], 11), false, { atten: 0, alpha: 0, maxPx: 14, soft: 2.0, order: 1 });

    this.layers = [this.wash, this.stars, this.body, this.haze, this.halo, this.companionStars, this.companionGlow, disc, this.dust, this.core, this.engine];
    this.layers.push(this.webGlow, this.web, this.homeDot, this.quasarDot);
    this.glowLayers = [this.body, this.haze, this.dust];
    this.discLayers = [disc];
    if (data.bulge.n > 0) {
      const bulge = new Layer(data.bulge, false, { spin: SPIN, twinkle: 0.1, alpha: 1, maxPx: 40, order: 2 });
      this.layers.push(bulge);
      this.discLayers.push(bulge);
      this.galaxy.add(bulge.object);
    }
    this.root.add(this.webGlow.object, this.web.object, this.homeDot.object, this.quasarDot.object);

    this.galaxy.rotation.z = -0.2;
    this.root.add(this.wash.object, this.stars.object, this.galaxy);
    this.galaxy.add(this.body.object, this.haze.object, this.halo.object, this.companionStars.object, this.companionGlow.object);
    this.galaxy.add(disc.object, this.dust.object, this.core.object);

    this.ink = [ring(RING, 0.6), ticks(RING, 0.5), ring(0.5, 0.22), ring(OUTER, 0.18), axis(0.22)];
    for (const line of this.ink) {
      line.frustumCulled = false;
      line.renderOrder = ORDER_INK;
      this.galaxy.add(line);
    }

    // The trail: peels off the outer ring and ends at the vessel. Same ink, brighter toward the ship.
    this.trailMaterial = new LineMaterial({
      color: 0xffffff,
      vertexColors: true,
      linewidth: 1,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      blending: AdditiveBlending,
    });
    this.trail = new Line2(new LineGeometry(), this.trailMaterial);
    this.trail.frustumCulled = false;
    this.trail.renderOrder = ORDER_INK + 1;

    const L = 0.016;
    const W = 0.0046;
    const H = 0.0034;
    const hull = new BufferGeometry().setFromPoints([new Vector3(L, 0, 0), new Vector3(-L * 0.55, 0, W), new Vector3(-L * 0.3, H, 0), new Vector3(-L * 0.55, 0, -W)]);
    hull.setIndex([0, 1, 2, 0, 2, 3, 0, 3, 1, 1, 3, 2]);
    this.vessel = new Mesh(hull, new MeshBasicMaterial({ color: INK, transparent: true, depthTest: false, side: DoubleSide }));
    this.vessel.frustumCulled = false;
    this.vessel.renderOrder = ORDER_INK + 2;
    this.galaxy.add(this.trail, this.vessel, this.engine.object);
  }

  /** Draw only part of the glow sprites (the governor's last step); the rest carry the light of those dropped. */
  setGlow(fraction: number): void {
    for (const layer of this.glowLayers) layer.fraction = fraction;
    this.glowGain = 1 / fraction;
  }

  /** Sizes, line resolution, and the vessel's place in the hero composition. */
  resize(camera: PerspectiveCamera, width: number, height: number, dpr: number): void {
    const bw = width * dpr;
    const bh = height * dpr;
    const px = (6 * dpr * height) / 1000;
    for (const layer of this.layers) layer.resize(px, dpr, bw, bh);
    for (const line of [...this.ink, this.trail]) line.material.resolution.set(bw, bh);
    this.layoutVessel(camera, width, height);
    this.layoutQuasar(camera, width, height);
  }

  /**
   * The quasar is a galaxy of the web: the knot nearest to where the zoomed-out composition
   * wants its beacon. If no knot is near, it sits in the plane of the web at that spot.
   */
  private layoutQuasar(camera: PerspectiveCamera, width: number, height: number): void {
    placeCamera(camera, 2, width, height);
    const [wantX, wantY] = isPhone(width, height) ? QUASAR_WANT.narrow : QUASAR_WANT.wide;
    const v = this.scratch[0];
    let best = 0.3; // NDC: farther than this is not "near"
    let found = false;
    for (let i = 1; i < this.webNodes.length; i++) {
      const [x, y, z] = this.webNodes[i];
      v.set(x, y, z).project(camera);
      if (v.z >= 1) continue;
      const d = Math.hypot(v.x - wantX, (v.y - wantY) * (height / width));
      if (d < best) {
        best = d;
        found = true;
        this.quasar.set(x, y, z);
      }
    }
    if (!found) {
      const e = camera.projectionMatrix.elements;
      const dir = v.set((wantX + e[8]) / e[0], (wantY + e[9]) / e[5], -1).transformDirection(camera.matrixWorld);
      this.quasar.copy(camera.position).addScaledVector(dir, -camera.position.y / dir.y);
    }
    this.quasarDot.object.position.copy(this.quasar);
  }

  /** Puts the vessel where the hero composition wants it, then draws the trail back to the ring. */
  private layoutVessel(camera: PerspectiveCamera, width: number, height: number): void {
    placeCamera(camera, 0, width, height);
    this.root.updateMatrixWorld(true);
    const phone = isPhone(width, height);
    const ndcX = phone ? 0.3 : 0.2;
    const ndcY = phone ? -0.04 : -0.56;
    const depth = phone ? 2.0 : 1.25;
    // unproject by hand because of the lens shift
    const e = camera.projectionMatrix.elements;
    const vx = ((ndcX + e[8]) * depth) / e[0];
    const vy = ((ndcY + e[9]) * depth) / e[5];
    const world = new Vector3(vx, vy, -depth).applyMatrix4(camera.matrixWorld);
    const end = this.galaxy.worldToLocal(world);
    // A spiral in the ring's own plane: leaves the ring tangentially, then eases to the vessel's radius and height.
    const endAng = Math.atan2(end.z, end.x);
    const endR = Math.hypot(end.x, end.z);
    const sweep = 1.75;
    const at = (s: number) => {
      const k = s * s * (3 - 2 * s);
      const a = endAng - sweep * (1 - s);
      const r = mix(RING, endR, k);
      return new Vector3(r * Math.cos(a), end.y * k * k, r * Math.sin(a));
    };
    const N = 240;
    const positions: number[] = [];
    const colors: number[] = [];
    const tint = new Color();
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      const p = at(u);
      positions.push(p.x, p.y, p.z);
      // ink to gold toward the ship; alpha 0.5 to 1, applied in display space (hence the 2.2)
      tint.copy(INK).lerp(GOLD, Math.pow(u, 3)).multiplyScalar(Math.pow(mix(0.5, 1, Math.pow(u, 1.5)), 2.2));
      colors.push(tint.r, tint.g, tint.b);
    }
    this.trail.geometry.dispose();
    this.trail.geometry = new LineGeometry().setPositions(positions).setColors(colors);

    const tangent = at(1).sub(at(0.985)).normalize();
    this.vessel.position.copy(end);
    this.vessel.quaternion.setFromUnitVectors(new Vector3(1, 0, 0), tangent);
    this.engine.object.position.copy(end).addScaledVector(tangent, -0.02);
  }

  /** One frame at scene time `t` and the camera at `view`; the fade ranges are the prototype's `frame()`. */
  frame(camera: PerspectiveCamera, t: number, view: SceneInput, width: number, height: number, out: SceneFrame): void {
    const zoom = this.subject ? 0 : view.zoom;
    placeCamera(camera, zoom, width, height, view.yaw, view.pitch, this.subject);
    this.camera = camera;
    this.time = t;
    this.zoom = zoom;
    this.width = width;
    this.height = height;

    const l1 = 1 - sstep(1.25, 1.6, zoom); // level 1 ink and vessel
    const far = sstep(1.2, 1.7, zoom);
    const near = 1 - sstep(1.3, 1.7, zoom);
    for (const layer of this.layers) layer.time = t;
    this.stars.alpha = mix(1, 0.12, far);
    this.wash.alpha = 0.05 * (1 - far);
    const glow = near * this.glowGain;
    this.haze.alpha = this.glow.haze * glow;
    this.body.alpha = this.glow.body * glow;
    this.dust.alpha = this.glow.dust * glow;
    this.core.alpha = A.core * near;
    this.halo.alpha = A.halo * near;
    this.companionStars.alpha = A.halo * near;
    this.companionGlow.alpha = A.halo * near;
    // From the web the whole disc is under a pixel and the home dot stands for it.
    for (const layer of this.discLayers) layer.object.visible = zoom < 1.97;

    const inkLevel = mix(0.72, 1, sstep(0.2, 0.9, zoom)) * l1;
    for (const line of this.ink) {
      line.material.opacity = (line.material.userData.base as number) * inkLevel;
      line.visible = l1 > 0;
    }
    const ship = this.subject ? 0 : l1;
    this.trailMaterial.opacity = ship;
    this.trail.visible = ship > 0;
    this.vessel.material.opacity = ship;
    this.vessel.visible = ship > 0;
    this.engine.alpha = 0.9 * ship;

    const landmarks = sstep(1.6, 1.95, zoom);
    this.web.alpha = sstep(1.35, 1.9, zoom);
    this.webGlow.alpha = 0.11 * landmarks;
    this.homeDot.alpha = landmarks;
    this.quasarDot.alpha = landmarks;

    this.report(camera, t, zoom, width, height, out);
  }

  /** Projects the anchors and the chart ring for the DOM (beacons, labels). */
  private report(camera: PerspectiveCamera, t: number, zoom: number, width: number, height: number, out: SceneFrame): void {
    out.zoom = zoom;
    out.width = width;
    out.height = height;
    out.narrow = isPhone(width, height);
    out.shade = this.shade;
    const v = this.scratch[0];
    const ang = t * SPIN;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    for (const [name, anchor] of Object.entries(ANCHORS)) {
      if ("local" in anchor) {
        const [x, y, z] = anchor.local;
        if (anchor.spin) v.set(c * x + s * z, y, -s * x + c * z);
        else v.set(x, y, z);
        this.galaxy.localToWorld(v);
      } else if (anchor.web === "quasar") v.copy(this.quasar);
      else v.set(0, 0, 0);
      v.project(camera);
      const point = out.points[name];
      point.on = v.z < 1;
      point.x = (v.x * 0.5 + 0.5) * width;
      point.y = (-v.y * 0.5 + 0.5) * height;
    }
    // half the width of the ticked ring on screen: what label offsets are measured in
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      this.galaxy.localToWorld(v.set(RING * Math.cos(a), 0, RING * Math.sin(a))).project(camera);
      min = Math.min(min, v.x);
      max = Math.max(max, v.x);
    }
    out.radius = ((max - min) / 4) * width;
  }

  /**
   * How bright the scenery is under a screen point, for the last frame drawn. The point is cast
   * onto the galaxy's plane and looked up in the model of the disc, the companion and the ticked
   * ring; the web is not modelled.
   */
  private readonly shade = (x: number, y: number): number => {
    const camera = this.camera;
    const fade = 1 - sstep(1.3, 1.7, this.zoom);
    if (!camera || fade <= 0) return 0;
    const [eye, far, dir] = this.scratch;
    this.galaxy.worldToLocal(eye.copy(camera.position));
    this.galaxy.worldToLocal(far.set((x / this.width) * 2 - 1, 1 - (y / this.height) * 2, 0.5).unproject(camera));
    dir.copy(far).sub(eye);
    if (Math.abs(dir.y) < 1e-6) return 0;
    const k = -eye.y / dir.y;
    if (k <= 0) return 0;
    const hx = eye.x + dir.x * k;
    const hz = eye.z + dir.z * k;
    // undo the turn of the pattern: the model is in the coordinates the disc was built in
    const ang = this.time * SPIN;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    const disc = discBrightness(c * hx - s * hz, s * hx + c * hz);
    const companion = 0.5 * Math.exp(-((hx - SATELLITE[0]) ** 2 + (hz - SATELLITE[2]) ** 2) / (2 * 0.07 * 0.07));
    // the ticked ring and its ticks: a label should not sit across them
    const ring = 0.3 * Math.exp(-(((Math.hypot(hx, hz) - RING - 0.0375) / 0.045) ** 2));
    return Math.max(disc, companion, ring) * fade;
  };

  dispose(): void {
    this.root.traverse((object: Object3D) => {
      const mesh = object as Partial<Mesh>;
      mesh.geometry?.dispose();
      const material = mesh.material as Material | Material[] | undefined;
      if (Array.isArray(material)) material.forEach((m) => m.dispose());
      else material?.dispose();
    });
  }
}
