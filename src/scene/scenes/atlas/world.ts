/**
 * The atlas's three.js objects, built from `model.ts` (ARCHITECTURE.md 4): Level 1, the galaxy,
 * and Level 2, the cosmic web, cross-faded by the one zoom scalar.
 *
 * Layers in draw order: wash and stars; body, haze, halo, companion, and the web; the disc (and
 * the bulge on `low`); dust; core. All additive except dust, so only dust depends on order. A
 * layer whose strength is zero is not drawn at all. Nothing is drawn over the cosmos: no rings,
 * ticks, axis, vessel or trail (D-094).
 *
 * Each frame also tells the DOM where its named places are on screen (`ANCHORS`), so hotspots can
 * be real links laid over the canvas, and a dive can carry the camera into one of them (D-096).
 *
 * Production replacement for the prototype's shortcut (DESIGN_SPEC.md section 10): large glow
 * sprites are instanced quads, not gl.POINTS.
 */

import {
  AddEquation,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CustomBlending,
  Group,
  InstancedBufferAttribute,
  InstancedBufferGeometry,
  Matrix3,
  Matrix4,
  Mesh,
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
  type Texture,
} from "three";
import type { SceneFrame, SceneInput } from "../../host/store";
import type { ParticleTier } from "../../quality/tiers";
import { POINT_FRAGMENT, POINT_VERTEX, SPRITE_FRAGMENT, SPRITE_VERTEX } from "../../shaders/points.glsl";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { isPhone, placeCamera } from "./camera";
import { StartProps } from "./start";
import { armAngle, buildAtlas, COUNTS, joinClouds, mix, OUTER, SPIN, sstep, TAU, type Cloud, type Vec3 } from "./model";

// base strengths, faded out together at the far zoom
const A = { haze: 0.05, body: 0.02, dust: 0.1, core: 0.2, halo: 0.8 };
// S2 (D-111): the disc's new layers, at the `high` counts
const S2 = { filaments: 0.45, clusterStars: 0.85, clusterGlow: 0.09, clouds: 0.04, fineDust: 0.16, heart: 0.035, webStrands: 0.42, webGlow: 0.26 };
/** D-112: how fast the black hole's disc and its feeding streams turn (radians per second), and their strength. */
const NUCLEUS_SPIN = 0.22;
const NUCLEUS = { glow: 1.6 };

/** View depth under which a disc particle fades as the camera passes it (a dive); the fade ends just past the camera's near plane (0.05). */
const NEAR = 0.12;

/**
 * The places a hotspot can stand. `content/places.ts` names one per place; the scene
 * owns where each one is, because that depends on the galaxy as generated and on the composition.
 */
const NEBULA_R = 0.74;
const NEBULA_TH = armAngle(1, NEBULA_R);
// D-116: a neutron star between the arms, and a star like the Sun out in a minor arm
const PULSAR_R = 0.46;
const PULSAR_TH = armAngle(0, PULSAR_R) + 1.3;
const SUN_R = 0.62;
const SUN_TH = armAngle(2, SUN_R);
// D-117: a strange star near the heart, between the arms; a Dyson sphere out on an arm's edge
const STRANGE_R = 0.3;
const STRANGE_TH = armAngle(1, STRANGE_R) + 1.4;
const DYSON_R = 0.9;
const DYSON_TH = armAngle(3, DYSON_R);
type Anchor = { local: Vec3; spin: boolean } | { web: "quasar" | "home" | "void" };
const ANCHORS: Record<string, Anchor> = {
  /** The heart of the galaxy. */
  core: { local: [0, 0, 0], spin: false },
  /** A place in one of the main arms; it turns with the disc. */
  arm: { local: [NEBULA_R * Math.cos(NEBULA_TH), 0, NEBULA_R * Math.sin(NEBULA_TH)], spin: true },
  /** A neutron star in the disc, between the arms (D-116). */
  pulsar: { local: [PULSAR_R * Math.cos(PULSAR_TH), 0, PULSAR_R * Math.sin(PULSAR_TH)], spin: true },
  /** A star like the Sun, out in a minor arm (D-116). */
  sun: { local: [SUN_R * Math.cos(SUN_TH), 0, SUN_R * Math.sin(SUN_TH)], spin: true },
  /** A strange star near the heart (D-117). */
  strange: { local: [STRANGE_R * Math.cos(STRANGE_TH), 0, STRANGE_R * Math.sin(STRANGE_TH)], spin: true },
  /** A Dyson sphere around a star on an outer arm (D-117). */
  dyson: { local: [DYSON_R * Math.cos(DYSON_TH), 0, DYSON_R * Math.sin(DYSON_TH)], spin: true },
  /** A supervoid: an empty stretch of the web, placed where the zoomed-out composition wants it (D-117). */
  void: { web: "void" },
  /** A far galaxy of the web, placed where the zoomed-out composition wants it. */
  quasar: { web: "quasar" },
  /** The galaxy the visitor came from. */
  home: { web: "home" },
};

/** Where the quasar's hotspot should fall in the zoomed-out view, in NDC (the prototype's). */
const QUASAR_WANT = { wide: [0.4, -0.38], narrow: [0.42, 0.55] } as const;
/** And the supervoid's, in an empty part of the frame (D-117). */
const VOID_WANT = { wide: [-0.3, 0.12], narrow: [-0.35, -0.2] } as const;

export function makeFrame(): SceneFrame {
  const points: SceneFrame["points"] = {};
  for (const name of Object.keys(ANCHORS)) points[name] = { x: 0, y: 0, on: false };
  return { zoom: 0, width: 1, height: 1, narrow: false, points, radius: 1 };
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
  near?: number;
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
        uNear: { value: o.near ?? 0 },
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

/**
 * The deep sky behind the galaxy and the web (D-101): one full-screen triangle drawn first, each
 * pixel looking out along its own direction from the camera, so the clouds and stars turn with the
 * view. Full around the galaxy; it thins toward the web, where the space between galaxies is dark.
 */
const BACKDROP_VERTEX = /* glsl */ `
varying vec2 vNdc;
void main(){ vNdc = position.xy; gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const BACKDROP_FRAGMENT = /* glsl */ `
precision highp float;
uniform mat4 uInvProj;
uniform mat3 uCamRot;
uniform float uRich;
varying vec2 vNdc;
${SKY_CHUNK}
void main(){
  vec4 v = uInvProj * vec4(vNdc, 1.0, 1.0);
  vec3 dir = normalize(uCamRot * normalize(v.xyz / v.w));
  gl_FragColor = vec4(skyDeep(dir, uRich), 1.0);
}
`;

function backdrop(sky: Texture): Mesh<BufferGeometry, ShaderMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader: BACKDROP_VERTEX,
    fragmentShader: BACKDROP_FRAGMENT,
    uniforms: { uInvProj: { value: new Matrix4() }, uCamRot: { value: new Matrix3() }, uRich: { value: 1 }, uSky: { value: sky } },
    depthTest: false,
    depthWrite: false,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = -1;
  return mesh;
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
  private readonly discLayers: Layer[];
  /** S2's additions to the galaxy, each with its base strength; they fade out with the rest. */
  private readonly s2: [Layer, number][];
  private readonly webStrands: Layer;
  private readonly nucleus: Layer;
  /** The disc's own strength; close in it is dimmed a little so the arms do not burn to white. */
  private readonly discAlpha: number;
  private readonly web: Layer;
  private readonly webGlow: Layer;
  private readonly homeDot: Layer;
  private readonly quasarDot: Layer;
  private readonly webNodes: Vec3[];
  private readonly sky: Mesh<BufferGeometry, ShaderMaterial>;
  /** The start page's planet, moons, asteroids and ship (D-107); drawn only while `intro` is above 0. */
  private readonly start: StartProps;
  private readonly quasar = new Vector3();
  private readonly voidPoint = new Vector3();
  private readonly focus = new Vector3();
  private readonly scratch = new Vector3();
  /** Strengths of the glow layers for this tier; see the constructor. */
  private readonly glow: { body: number; haze: number; dust: number };
  private glowGain = 1;

  constructor(tier: ParticleTier, narrow: boolean, sky: Texture) {
    this.sky = backdrop(sky);
    this.start = new StartProps(narrow);
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
    this.discAlpha = discAlpha;

    this.wash = new Layer(data.wash, true, { atten: 0, alpha: 0.07, maxPx: 1024, soft: 2.2, order: 0 });
    this.stars = new Layer(data.stars, false, { atten: 0, twinkle: 0.35, maxPx: 8, alpha: 1.0, soft: 1.3, order: 0 });
    this.body = new Layer(data.body, true, { spin: SPIN, alpha: this.glow.body, soft: 2.0, maxPx: 1024, order: 1 });
    this.haze = new Layer(data.haze, true, { spin: SPIN, alpha: this.glow.haze, soft: 2.0, maxPx: 1024, order: 1 });
    this.halo = new Layer(data.halo, false, { spin: SPIN, twinkle: 0.2, alpha: A.halo, maxPx: 12, order: 1 });
    this.companionStars = new Layer(data.companionStars, false, { twinkle: 0.2, alpha: A.halo, maxPx: 1024, order: 1 });
    this.companionGlow = new Layer(data.companionGlow, true, { twinkle: 0.2, alpha: A.halo, maxPx: 1024, order: 1 });
    // fewer points carry more light each
    const disc = new Layer(data.disc, false, { spin: SPIN, twinkle: 0.15, alpha: discAlpha, maxPx: 40, order: 2, near: NEAR });
    // the fine dust (S2) rides in the dust layer: one draw call, not two
    this.dust = new Layer(joinClouds(data.dust, data.fineDust, S2.fineDust / A.dust), true, { spin: SPIN, alpha: this.glow.dust, soft: 1.7, maxPx: 1024, dust: true, order: 3, near: NEAR * 2 });
    // the heart's wide warm glow (S2) rides in the core's layer: one draw call, not two
    this.core = new Layer(joinClouds(data.core, data.heart, S2.heart / A.core), true, { alpha: A.core, soft: 3.2, maxPx: 2048, order: 4 });

    // Level 2. Nothing of it is drawn until the zoom reaches it. Our galaxy and the quasar are
    // two of its lights, a little brighter than the rest: no marker is drawn on them (D-094).
    this.webNodes = data.webNodes;
    this.webGlow = new Layer(data.webGlow, true, { alpha: 0, maxPx: 1024, soft: 2.0, order: 1 });
    this.web = new Layer(data.web, false, { alpha: 0, twinkle: 0.1, maxPx: 12, soft: 1.4, order: 1 });
    this.homeDot = new Layer(single([1.0, 0.9, 0.74], 7), false, { atten: 0, alpha: 0, maxPx: 10, soft: 2.2, order: 1 });
    this.quasarDot = new Layer(single([0.85, 0.94, 1.0], 9), false, { atten: 0, alpha: 0, maxPx: 12, soft: 2.0, order: 1 });

    // S2: filaments, young clumps and their glow, clouds, fine dust, a warm heart. Lower tiers
    // on a wide screen carry more light per particle, as the glow layers above do.
    const more = (key: "filaments" | "clusters" | "clouds" | "fineDust") => (narrow ? 1 : Math.sqrt(top[key] / counts[key]));
    const filaments = new Layer(data.filaments, false, { spin: SPIN, twinkle: 0.1, alpha: 0, maxPx: 40, order: 2, near: NEAR });
    const clusterStars = new Layer(data.clusterStars, false, { spin: SPIN, twinkle: 0.2, alpha: 0, maxPx: 40, order: 2, near: NEAR });
    const clusterGlow = new Layer(data.clusterGlow, true, { spin: SPIN, alpha: 0, soft: 2.0, maxPx: 1024, order: 2, near: NEAR * 2 });
    const clouds = new Layer(data.clouds, true, { spin: SPIN, alpha: 0, soft: 2.2, maxPx: 1024, order: 1, near: NEAR * 3 });

    this.s2 = [
      [filaments, S2.filaments * more("filaments")],
      [clusterStars, S2.clusterStars * more("clusters")],
      [clusterGlow, S2.clusterGlow * more("clusters")],
      [clouds, S2.clouds * more("clouds")],
    ];
    // the heart (D-113): light pouring in, a hot disc and streams spiralling into the black hole; no dark spot, as in real galaxy images
    this.nucleus = new Layer(data.nucleus, false, { spin: NUCLEUS_SPIN, twinkle: 0.12, alpha: NUCLEUS.glow, maxPx: 40, order: 7, near: NEAR });
    this.webStrands = new Layer(data.webStrands, true, { alpha: 0, maxPx: 1024, soft: 2.2, order: 1 });

    this.layers = [this.wash, this.stars, this.body, this.haze, this.halo, this.companionStars, this.companionGlow, disc, this.dust, this.core];
    for (const [layer] of this.s2) this.layers.push(layer);
    this.layers.push(this.nucleus);
    this.layers.push(this.webStrands);
    this.layers.push(this.webGlow, this.web, this.homeDot, this.quasarDot);
    // the governor's last step thins every large glow layer, S2's included (D-111)
    this.glowLayers = [this.body, this.haze, this.dust, clouds, clusterGlow, this.webStrands];
    this.discLayers = [disc, filaments, clusterStars, clusterGlow, clouds, this.nucleus];
    if (data.bulge.n > 0) {
      const bulge = new Layer(data.bulge, false, { spin: SPIN, twinkle: 0.1, alpha: 1, maxPx: 40, order: 2 });
      this.layers.push(bulge);
      this.discLayers.push(bulge);
      this.galaxy.add(bulge.object);
    }
    this.root.add(this.start.root);
    this.root.add(this.sky, this.webGlow.object, this.webStrands.object, this.web.object, this.homeDot.object, this.quasarDot.object);

    this.galaxy.rotation.z = -0.2;
    this.root.add(this.wash.object, this.stars.object, this.galaxy);
    this.galaxy.add(this.body.object, this.haze.object, this.halo.object, this.companionStars.object, this.companionGlow.object);
    this.galaxy.add(disc.object, this.dust.object, this.core.object);
    for (const [layer] of this.s2) this.galaxy.add(layer.object);
    this.galaxy.add(this.nucleus.object);
    this.root.updateMatrixWorld(true);
  }

  /** Draw only part of the glow sprites (the governor's last step); the rest carry the light of those dropped. */
  setGlow(fraction: number): void {
    for (const layer of this.glowLayers) layer.fraction = fraction;
    this.glowGain = 1 / fraction;
  }

  /** Sizes, and the quasar's place in the zoomed-out composition. */
  resize(camera: PerspectiveCamera, width: number, height: number, dpr: number): void {
    const bw = width * dpr;
    const bh = height * dpr;
    const px = (6 * dpr * height) / 1000;
    for (const layer of this.layers) layer.resize(px, dpr, bw, bh);
    this.layoutQuasar(camera, width, height);
  }

  /**
   * The quasar is a galaxy of the web: the knot nearest to where the zoomed-out composition
   * wants its hotspot. If no knot is near, it sits in the plane of the web at that spot.
   */
  private layoutQuasar(camera: PerspectiveCamera, width: number, height: number): void {
    placeCamera(camera, 2, width, height);
    const [wantX, wantY] = isPhone(width, height) ? QUASAR_WANT.narrow : QUASAR_WANT.wide;
    const v = this.scratch;
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
    // the supervoid: the point in the plane of the web under its spot on screen, among no knot
    const [vx, vy] = isPhone(width, height) ? VOID_WANT.narrow : VOID_WANT.wide;
    const pe = camera.projectionMatrix.elements;
    const toVoid = v.set((vx + pe[8]) / pe[0], (vy + pe[9]) / pe[5], -1).transformDirection(camera.matrixWorld);
    this.voidPoint.copy(camera.position).addScaledVector(toVoid, -camera.position.y / toVoid.y);
  }

  /** Where a named place is in the world at scene time `t`. */
  private anchorAt(name: string, t: number, out: Vector3): Vector3 {
    const anchor = ANCHORS[name];
    if (!anchor) return out.set(0, 0, 0);
    if ("web" in anchor) return anchor.web === "quasar" ? out.copy(this.quasar) : anchor.web === "void" ? out.copy(this.voidPoint) : out.set(0, 0, 0);
    const [x, y, z] = anchor.local;
    const ang = t * SPIN;
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    if (anchor.spin) out.set(c * x + s * z, y, -s * x + c * z);
    else out.set(x, y, z);
    return this.galaxy.localToWorld(out);
  }

  /** One frame at scene time `t` and the camera at `view`; the fade ranges are the prototype's `frame()`. */
  frame(camera: PerspectiveCamera, t: number, view: SceneInput, width: number, height: number, out: SceneFrame): void {
    const zoom = view.zoom;
    const focus = view.focus && view.dive > 0 ? this.anchorAt(view.focus, t, this.focus) : null;
    placeCamera(camera, zoom, width, height, view.yaw, view.pitch, focus, view.dive, view.intro);
    this.start.frame(camera, t, view.intro);

    const far = sstep(1.2, 1.7, zoom);
    const near = 1 - sstep(1.3, 1.7, zoom);
    const sky = this.sky.material.uniforms;
    (sky.uInvProj.value as Matrix4).copy(camera.projectionMatrixInverse);
    (sky.uCamRot.value as Matrix3).setFromMatrix4(camera.matrixWorld);
    sky.uRich.value = mix(1, 0.45, far);
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
    // close in the arms overlap into white: the disc's light is turned down toward stop 0
    const closeIn = mix(0.7, 1, sstep(0, 1, zoom));
    this.discLayers[0].alpha = this.discAlpha * closeIn;
    this.nucleus.alpha = NUCLEUS.glow * near;
    for (const [layer, base] of this.s2) {
      const thinned = this.glowLayers.includes(layer) ? this.glowGain : 1;
      layer.alpha = base * near * thinned * (layer.material.blending === AdditiveBlending ? closeIn : 1);
    }
    // From the web the whole disc is under a pixel and the home light stands for it.
    for (const layer of this.discLayers) layer.object.visible = zoom < 1.97 && layer.material.uniforms.uAlpha.value > 0.0005;

    const landmarks = sstep(1.6, 1.95, zoom);
    this.web.alpha = sstep(1.35, 1.9, zoom);
    this.webGlow.alpha = S2.webGlow * landmarks;
    this.webStrands.alpha = S2.webStrands * landmarks * this.glowGain;
    this.homeDot.alpha = landmarks;
    this.quasarDot.alpha = landmarks;

    this.report(camera, t, zoom, width, height, out);
  }

  /** Projects the anchors for the DOM (hotspots). */
  private report(camera: PerspectiveCamera, t: number, zoom: number, width: number, height: number, out: SceneFrame): void {
    out.zoom = zoom;
    out.width = width;
    out.height = height;
    out.narrow = isPhone(width, height);
    const v = this.scratch;
    for (const name of Object.keys(ANCHORS)) {
      this.anchorAt(name, t, v).project(camera);
      const point = out.points[name];
      point.on = v.z < 1;
      point.x = (v.x * 0.5 + 0.5) * width;
      point.y = (-v.y * 0.5 + 0.5) * height;
    }
    // half the width of the disc on screen
    let min = Infinity;
    let max = -Infinity;
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      this.galaxy.localToWorld(v.set(OUTER * Math.cos(a), 0, OUTER * Math.sin(a))).project(camera);
      min = Math.min(min, v.x);
      max = Math.max(max, v.x);
    }
    out.radius = ((max - min) / 4) * width;
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
