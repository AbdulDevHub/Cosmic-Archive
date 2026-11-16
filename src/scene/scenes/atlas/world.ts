/**
 * The atlas's three.js objects, built from `model.ts` (ARCHITECTURE.md 4). Level 1 only in F3a.
 *
 * Layers in draw order: wash and stars; body, haze, halo, companion; the disc (and the bulge on
 * `low`); dust; core; ink; trail; vessel. All additive except dust, so only dust depends on order.
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
import type { ParticleTier } from "../../quality/tiers";
import { POINT_FRAGMENT, POINT_VERTEX, SPRITE_FRAGMENT, SPRITE_VERTEX } from "../../shaders/points.glsl";
import { isPhone, placeCamera } from "./camera";
import { buildAtlas, C, COUNTS, mix, OUTER, RING, SPIN, sstep, TAU, type Cloud } from "./model";

// base strengths, faded out together at the far zoom
const A = { haze: 0.05, body: 0.02, dust: 0.1, core: 0.22, halo: 0.8 };
const ORDER_INK = 6;

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

  set alpha(value: number) {
    this.material.uniforms.uAlpha.value = value;
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
  private readonly ink: Array<Line2 | LineSegments2>;
  private readonly trail: Line2;
  private readonly trailMaterial: LineMaterial;
  private readonly vessel: Mesh<BufferGeometry, MeshBasicMaterial>;
  /** Strengths of the glow layers for this tier; see the constructor. */
  private readonly glow: { body: number; haze: number; dust: number };
  private glowGain = 1;

  constructor(tier: ParticleTier, narrow: boolean) {
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

    this.layers = [this.wash, this.stars, this.body, this.haze, this.halo, this.companionStars, this.companionGlow, disc, this.dust, this.core, this.engine];
    this.glowLayers = [this.body, this.haze, this.dust];
    if (data.bulge.n > 0) {
      const bulge = new Layer(data.bulge, false, { spin: SPIN, twinkle: 0.1, alpha: 1, maxPx: 40, order: 2 });
      this.layers.push(bulge);
      this.galaxy.add(bulge.object);
    }

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

  /** One frame at scene time `t` and zoom `zoom`; the fade ranges are the prototype's `frame()`. */
  frame(camera: PerspectiveCamera, t: number, zoom: number, width: number, height: number): void {
    placeCamera(camera, zoom, width, height);
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
    const inkLevel = mix(0.72, 1, sstep(0.2, 0.9, zoom)) * l1;
    for (const line of this.ink) line.material.opacity = (line.material.userData.base as number) * inkLevel;
    this.trailMaterial.opacity = l1;
    this.vessel.material.opacity = l1;
    this.engine.alpha = 0.9 * l1;
  }

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
