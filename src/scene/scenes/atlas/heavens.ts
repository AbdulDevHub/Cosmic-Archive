/**
 * The Seven Heavens (D-174): the atlas's last stop, out past the observable universe. Abstract
 * light, no picture of anything: the universe's ball shrinks to a small blue-white light at the
 * middle, and round it seven heavens, one above the other, each vaster than the one inside it,
 * stand as seven soft layers of light, from deep indigo near the middle out through violet, rose and
 * gold to a pale, warm white at the outermost. Each layer is a filled glow whose edge melts away and
 * whose light drifts slowly, so they read as light, never as rings. One full-screen triangle, one
 * draw call, drawn over the universe as the zoom leaves it.
 */

import { BufferAttribute, BufferGeometry, CustomBlending, AddEquation, Mesh, OneFactor, OneMinusSrcAlphaFactor, ShaderMaterial, Vector2, ZeroFactor } from "three";

const VERTEX = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const FRAGMENT = /* glsl */ `
precision highp float;
uniform vec2 uHome;     // the universe's middle on screen, device pixels from the bottom left
uniform float uUnit;    // device pixels per unit (half the window's height)
uniform float uInner;   // the first heaven's radius, in units
uniform float uTime;
uniform float uAlpha;
uniform vec2 uTurn;     // the drag, so the light drifts with it

float hash(vec3 p){
  p = fract(p * 0.3183099 + 0.1);
  p *= 17.0;
  return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
}
float noise(vec3 x){
  vec3 i = floor(x), f = fract(x);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x), mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x), mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float fbm(vec3 p){
  float s = 0.0, w = 0.5;
  for (int i = 0; i < 4; i++) { s += w * noise(p); p = p * 2.03 + 3.1; w *= 0.5; }
  return s / 0.9375;
}

/* the colour of the k-th heaven, 0 the innermost: indigo, violet, rose, gold, warm white */
vec3 heavenColour(float k){
  vec3 a = vec3(0.22, 0.22, 0.75), b = vec3(0.55, 0.32, 0.95), c = vec3(1.0, 0.45, 0.62), d = vec3(1.0, 0.78, 0.42), e = vec3(1.0, 0.96, 0.88);
  float x = k / 6.0 * 4.0;
  return x < 1.0 ? mix(a, b, x) : x < 2.0 ? mix(b, c, x - 1.0) : x < 3.0 ? mix(c, d, x - 2.0) : mix(d, e, x - 3.0);
}

void main(){
  vec2 w = (gl_FragCoord.xy - uHome) / uUnit;
  float r = length(w);
  float t = uTime;
  vec3 col = vec3(0.0);
  float cover = 0.0;
  for (int i = 0; i < 7; i++) {
    float k = float(i);
    float R = uInner * pow(1.52, k);
    // a filled glow, strongest inside its own edge, the edge melting over a wide band
    float body = smoothstep(R * 1.12, R * 0.72, r);
    float l = r / R;
    float drift = fbm(vec3(w / R * 1.6 + uTurn * (0.3 + 0.1 * k), k * 3.7 + t * 0.03));
    float glow = body * (0.06 + 0.09 * drift) * (1.0 - 0.3 * smoothstep(0.0, 1.0, l));
    // where one heaven gives way to the next, its light gathers: a wide, soft swell, broken by the
    // drifting light so it never closes into a ring
    float swell = exp(-pow((l - 0.92) / 0.16, 2.0)) * smoothstep(0.35, 0.75, drift) * 0.22;
    col += heavenColour(k) * (glow + swell);
    cover += body * 0.08;
  }
  // a little sparkle of light in the outer heavens
  vec2 g = w * 60.0;
  float sp = step(0.985, hash(vec3(floor(g), 4.0))) * exp(-length(fract(g) - 0.5) * 10.0);
  col += vec3(1.0, 0.95, 0.85) * sp * smoothstep(uInner * 2.0, uInner * 8.0, r) * smoothstep(uInner * 16.0, uInner * 10.0, r) * 0.5;
  col *= uAlpha;
  // premultiplied: the heavens soften what is behind them a little, so the light reads as one whole
  gl_FragColor = vec4(col, min(cover, 0.45) * uAlpha);
}
`;

export function heavens(): Mesh<BufferGeometry, ShaderMaterial> {
  const geometry = new BufferGeometry();
  geometry.setAttribute("position", new BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3));
  const material = new ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uHome: { value: new Vector2() },
      uUnit: { value: 1 },
      uInner: { value: 0.12 },
      uTime: { value: 0 },
      uAlpha: { value: 0 },
      uTurn: { value: new Vector2() },
    },
    transparent: true,
    depthTest: false,
    depthWrite: false,
    blending: CustomBlending,
    blendEquation: AddEquation,
    blendSrc: OneFactor,
    blendDst: OneMinusSrcAlphaFactor,
    blendSrcAlpha: ZeroFactor,
    blendDstAlpha: OneFactor,
  });
  const mesh = new Mesh(geometry, material);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.visible = false;
  return mesh;
}
