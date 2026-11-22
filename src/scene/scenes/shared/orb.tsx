/**
 * One round body drawn by a single full-screen shader (D-116): the neutron star and the star. As
 * with the nebula, the composition is set in CSS pixels, not by a camera: the body stands in the
 * middle of the window, `uScale` CSS pixels to one of its radii. On arrival (`view.arrive`, D-096)
 * it grows to that size; it opens all the way in (D-112) and the wheel moves out to its framing. A
 * drag turns it (`uYaw`, `uPitch`), dragging down tipping its top toward the visitor (D-113).
 *
 * Each scene gives only its fragment shader and its composition; this file is the rest.
 */

import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { BufferAttribute, BufferGeometry, Mesh, ShaderMaterial, Vector2, type Texture } from "three";
import type { SceneFrame, SceneInput } from "../../host/store";
import type { SceneProps } from "../../host/types";
import { RUNGS, type ParticleTier } from "../../quality/tiers";
import { bakeSky } from "../../sky";
import { placeScale } from "../black-hole/world";

export const ORB_VERTEX = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export interface OrbConfig {
  fragment: string;
  /** CSS pixels per radius at the framing, for a window of this size. */
  framing: (width: number, height: number) => number;
  /** How much larger it is all the way in. */
  close: number;
  /** How large it is when an arrival starts, as a share of its full size. */
  arriveFrom: number;
  /** Detail per tier, handed to the shader as `uDetail` (0 low, 1 medium, 2 high). */
  detail?: Record<ParticleTier, number>;
}

const isPhone = (width: number, height: number) => width / height < 0.8;
const PITCH_LIMIT = 1.35;

class OrbWorld {
  readonly root: Mesh;
  private readonly material: ShaderMaterial;
  private scale = 1;

  constructor(
    sky: Texture,
    private readonly config: OrbConfig,
  ) {
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
    this.material = new ShaderMaterial({
      vertexShader: ORB_VERTEX,
      fragmentShader: config.fragment,
      depthTest: false,
      depthWrite: false,
      uniforms: {
        uResolution: { value: new Vector2(1, 1) },
        uDpr: { value: 1 },
        uCentre: { value: new Vector2(0, 0) },
        uScale: { value: 1 },
        uTime: { value: 0 },
        uYaw: { value: 0 },
        uPitch: { value: 0 },
        uDetail: { value: 2 },
        uSky: { value: sky },
      },
    });
    this.root = new Mesh(geometry, this.material);
    this.root.frustumCulled = false;
  }

  resize(width: number, height: number, dpr: number, tier: ParticleTier, frame: SceneFrame): void {
    const u = this.material.uniforms;
    u.uResolution.value.set(Math.round(width * dpr), Math.round(height * dpr));
    u.uDpr.value = dpr;
    u.uCentre.value.set(width * 0.5, height * (isPhone(width, height) ? 0.42 : 0.5));
    u.uDetail.value = this.config.detail?.[tier] ?? 2;
    this.scale = this.config.framing(width, height);
    frame.width = width;
    frame.height = height;
    frame.narrow = isPhone(width, height);
    frame.radius = this.scale;
  }

  setView(view: SceneInput): void {
    const u = this.material.uniforms;
    u.uScale.value = this.scale * placeScale(view.arrive, view.zoom, this.config.arriveFrom, this.config.close);
    u.uYaw.value = view.yaw;
    u.uPitch.value = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, view.pitch));
  }

  setTime(seconds: number): void {
    this.material.uniforms.uTime.value = seconds;
  }

  dispose(): void {
    this.root.geometry.dispose();
    this.material.dispose();
  }
}

const makeFrame = (): SceneFrame => ({ zoom: 0, width: 1, height: 1, narrow: false, points: {}, radius: 1 });

/** The scene component for one orb. */
export function useOrbScene(config: OrbConfig, { rung, time, view, publish, onReady }: SceneProps) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const dpr = useThree((s) => s.viewport.dpr);
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);
  const tier = RUNGS[rung].particles;

  // the deep sky's clouds behind it, drawn once (D-101)
  const sky = useMemo(() => bakeSky(gl), [gl]);
  useEffect(() => () => sky.dispose(), [sky]);
  const world = useMemo(() => new OrbWorld(sky.texture, config), [sky, config]);
  useEffect(() => () => world.dispose(), [world]);
  const frame = useMemo(() => makeFrame(), []);

  useLayoutEffect(() => {
    world.resize(width, height, dpr, tier, frame);
    invalidate();
  }, [world, frame, width, height, dpr, tier, invalidate]);

  const drawn = useRef(false);
  useFrame(() => {
    world.setTime(time.current);
    world.setView(view.current as SceneInput);
    publish(frame);
    if (!drawn.current) {
      drawn.current = true;
      requestAnimationFrame(() => onReady()); // the frame is on screen by the next animation frame
    }
  });

  return world.root;
}

/** Shared GLSL: the frame's coordinates, the drag's turn, and 3D value noise. */
export const ORB_COMMON = /* glsl */ `
precision highp float;
uniform vec2 uResolution;  // drawing buffer, device pixels
uniform float uDpr;        // device pixels per CSS pixel
uniform vec2 uCentre;      // the body on screen, CSS pixels from the top left
uniform float uScale;      // CSS pixels per radius
uniform float uTime;
uniform float uYaw, uPitch;
uniform int uDetail;

const float TAU = 6.28318530718;

mat3 turnY(float a){ float c = cos(a), s = sin(a); return mat3(c, 0.0, -s, 0.0, 1.0, 0.0, s, 0.0, c); }
mat3 turnX(float a){ float c = cos(a), s = sin(a); return mat3(1.0, 0.0, 0.0, 0.0, c, s, 0.0, -s, c); }

float hash3(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise3(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash3(i), hash3(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 0.0)), hash3(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash3(i + vec3(0.0, 0.0, 1.0)), hash3(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash3(i + vec3(0.0, 1.0, 1.0)), hash3(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
/* fractal noise, 0 to 1: three octaves on the low tier, up to five on high */
float fbm3(vec3 p){
  float sum = 0.0, weight = 0.5, total = 0.0;
  for (int i = 0; i < 5; i++) {
    if (i > uDetail + 2) break;
    sum += weight * noise3(p);
    total += weight;
    p = p * 2.03 + vec3(1.7, 9.2, 3.1);
    weight *= 0.5;
  }
  return sum / total;
}
`;
