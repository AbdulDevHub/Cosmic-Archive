/**
 * The black hole, drawn on one full-screen triangle (ARCHITECTURE.md 5).
 *
 * Each pixel sends a ray back from the camera and bends it as the hole's gravity would: with
 * the horizon's radius as the unit of length, a light path obeys  a = -1.5 h² p / r⁵  (h is the
 * path's angular momentum), the Schwarzschild orbit equation in the form a marching loop can
 * step. A ray ends inside the horizon (black), or leaves and shows the stars behind. Whenever
 * it crosses the disc's plane inside the disc, it picks up the disc's light, front to back: that
 * alone gives the far side folded over the top, the thin ring at the shadow's edge, and (with
 * the orbital speed) the brighter approaching side.
 *
 * It is an illustration, not a simulation: the disc is a flat sheet of streaked light, the hole
 * does not spin, and the colours are the atlas's palette, not temperatures.
 *
 * Nothing is drawn over the picture: no lines, no labels (D-094).
 *
 * With `QUASAR` defined (the Quasars page, `scenes/quasar`) the same hole is seen from far off:
 * the disc is ember and white, only the pixels near the hole are marched, and three things are
 * added in screen space: the glare of the core, the host galaxy around it, and two jets along the
 * disc's axis, the near one brighter. Without
 * the define the shader is exactly the Black Holes scene.
 */

import { SKY_CHUNK } from "../../shaders/sky.glsl";

export const QUAD_VERTEX = /* glsl */ `
void main(){ gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

export const MAX_STEPS = 128;

export const BLACK_HOLE_FRAGMENT = /* glsl */ `
precision highp float;

uniform vec2 uResolution;  // drawing buffer, device pixels
uniform float uDpr;        // device pixels per CSS pixel
uniform vec2 uCentre;      // the hole on screen, CSS pixels from the top left
uniform float uScale;      // CSS pixels per horizon radius, at the hole
uniform float uTime;
uniform int uSteps;
uniform float uStride;     // step length as a fraction of the distance to the hole
uniform vec3 uCam, uRight, uUp, uFwd;
#ifdef QUASAR
uniform vec2 uJetDir;      // the near jet's direction on screen, y up
uniform float uJetLength;  // horizon radii
uniform float uHostAngle;  // the host galaxy's long axis on screen, radians
uniform float uMarch;      // CSS pixels from the hole inside which rays are bent
const vec3 AZURE = vec3(0.42, 0.66, 1.0);
const vec3 WHITE = vec3(0.94, 0.96, 1.0);
#endif

const float TAU = 6.28318530718;
const float R_IN = 3.0;    // inner edge of the disc: the last stable orbit of a hole that does not spin
const float R_OUT = 10.0;
const float R_FAR = 34.0;  // past this a ray is on its way out

const vec3 GOLD = vec3(1.0, 0.78, 0.42);
const vec3 EMBER = vec3(1.0, 0.46, 0.28);
const vec3 ROSE = vec3(0.98, 0.34, 0.62);
const vec3 VIOLET = vec3(0.52, 0.4, 1.0);
const vec3 SHADOW = vec3(0.012, 0.013, 0.036); // darker than the sky, never pure black

float hash21(vec2 p){
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

/* value noise that repeats every \`period\` cells along x, so it closes around the disc */
float ringNoise(vec2 p, float period){
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float x0 = mod(i.x, period), x1 = mod(i.x + 1.0, period);
  float a = hash21(vec2(x0, i.y)), b = hash21(vec2(x1, i.y));
  float c = hash21(vec2(x0, i.y + 1.0)), d = hash21(vec2(x1, i.y + 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float streaks(float r, float angle){
  float x = angle / TAU;
  return ringNoise(vec2(x * 14.0, r * 2.3), 14.0) * 0.6 + ringNoise(vec2(x * 44.0, r * 5.2 + 11.0), 44.0) * 0.4;
}

${SKY_CHUNK}

/* the deep sky behind the hole: at a galaxy's heart, full and warm, with the crowded core of stars
   right behind the hole so its light is bent into a ring; behind a quasar, the sparser sky between
   galaxies (D-101) */
#ifdef QUASAR
const float SKY_RICH = 0.55;
#else
const float SKY_RICH = 1.15;
#endif

/* the disc's light where a ray crosses its plane; rgb is light, a is how much it hides */
vec4 disc(vec3 hit, vec3 travel){
  float r = length(hit.xz);
  float edge = smoothstep(R_IN, R_IN + 0.45, r) * (1.0 - smoothstep(R_OUT - 2.6, R_OUT, r));
  if (edge <= 0.0) return vec4(0.0);

  // the gas turns faster nearer the hole; two copies of the pattern, half a cycle apart, are
  // cross-faded so the shear never winds the streaks into noise
  float angle = atan(hit.z, hit.x);
  float omega = 1.5 * pow(r, -1.5);
  const float CYCLE = 44.0;
  float t1 = mod(uTime, CYCLE), t2 = mod(uTime + CYCLE * 0.5, CYCLE);
  float w1 = 1.0 - abs(t1 / CYCLE * 2.0 - 1.0);
  float pattern = mix(streaks(r, angle - omega * (t2 - CYCLE * 0.5) + 1.7), streaks(r, angle - omega * (t1 - CYCLE * 0.5)), w1);
  pattern = 0.3 + 0.95 * pattern * pattern;

  // light from gas moving toward us is brighter, from gas moving away dimmer
  vec3 along = normalize(vec3(-hit.z, 0.0, hit.x));
  float beta = sqrt(0.5 / max(r - 1.0, 0.5));
  float toward = dot(along, -travel);
  float doppler = sqrt(1.0 - beta * beta) / (1.0 - beta * toward);
  float lift = sqrt(1.0 - 1.0 / r); // light climbing out of the hole's gravity loses energy

  float heat = pow(R_IN / r, 1.25) * doppler * lift * 1.25;
#ifdef QUASAR
  vec3 colour = mix(EMBER * 0.7, EMBER, smoothstep(0.1, 0.35, heat));
  colour = mix(colour, vec3(1.0, 0.86, 0.74), smoothstep(0.4, 0.8, heat));
  colour = mix(colour, WHITE, smoothstep(0.8, 1.4, heat));
#else
  vec3 colour = mix(VIOLET, ROSE, smoothstep(0.1, 0.3, heat));
  colour = mix(colour, EMBER, smoothstep(0.26, 0.5, heat));
  colour = mix(colour, GOLD, smoothstep(0.45, 0.8, heat));
  colour = mix(colour, vec3(1.0, 0.96, 0.88), smoothstep(0.8, 1.5, heat));
#endif

  float glow = pow(R_IN / r, 1.05) * pow(doppler, 1.9) * lift;
  float cover = edge * clamp(pattern, 0.0, 1.0);
  return vec4(colour * glow * pattern * 2.6, cover * 0.94);
}


#ifdef QUASAR
/* the galaxy the quasar lives in: a faint, mottled oval of starlight; u is in horizon radii */
vec3 hostGalaxy(vec2 u){
  float c = cos(uHostAngle), s = sin(uHostAngle);
  vec2 h = vec2(c * u.x + s * u.y, -s * u.x + c * u.y) / vec2(40.0, 16.0);
  float r = length(h);
  float body = exp(-r * r * 2.4) * 0.3 + exp(-r * 5.0) * 0.2;
  float mottle = ringNoise(h * 5.0 + 3.0, 400.0) * 0.6 + ringNoise(h * 13.0 + 9.0, 400.0) * 0.4;
  body *= 0.55 + 0.8 * mottle;
  // its own stars, thinning outward
  vec2 g = u * 1.6;
  vec2 id = floor(g);
  float star = hash21(id + 31.0);
  float speck = step(0.9, star) * smoothstep(0.32, 0.0, length(fract(g) - 0.5 - (vec2(hash21(id + 2.0), hash21(id + 5.0)) - 0.5) * 0.5));
  body += speck * exp(-r * r * 1.8) * 0.5 * (star - 0.9) * 10.0;
  return mix(EMBER * 0.85, vec3(1.0, 0.88, 0.76), exp(-r * 3.0)) * body;
}

/* how hard the engine is running: the jets and the core's glare breathe together (D-104) */
float beat(){
  return 0.82 + 0.13 * sin(uTime * 2.1) + 0.08 * sin(uTime * 5.3 + 1.0);
}

/*
 * One jet; along and across are in horizon radii, bright is 1 for the near jet (D-104). A white-hot
 * spine inside a wider beam inside a faint violet sheath, the whole column twisting as it goes;
 * bursts of light race outward along it, grains of light stream out with them, and at its end it
 * ploughs into the gas around the galaxy in a glowing lobe with a hot spot.
 */
vec3 jet(float along, float across, float bright){
  float L = uJetLength;
  if (along < 0.0) return vec3(0.0);
  float t = uTime;
  float width = 0.5 + along * 0.055;
  // the column sways a little as it goes
  float wobble = (ringNoise(vec2(along * 0.18 - t * 0.9, 3.0), 400.0) - 0.5) * width * 0.4;
  float x = across - wobble;
  float spine = exp(-(x * x) / (width * width * 0.08));
  float beam = exp(-(x * x) / (width * width));
  float sheath = exp(-(x * x) / (width * width * 9.0));
  float span = smoothstep(0.3, 1.8, along) * (1.0 - smoothstep(L * 0.82, L, along));
  // bursts racing outward
  float burst = pow(0.5 + 0.5 * sin(along * 0.5 - t * 4.2 + 2.2 * ringNoise(vec2(along * 0.12, 9.0), 400.0)), 5.0);
  // grains of light streaming out with them
  // (streaks along the jet, each in its own narrow lane: never bars across it)
  float lanes = x / width * 2.2;
  float lane = floor(lanes + 0.5);
  float g = along * 0.6 - t * 4.5;
  float grain = step(0.8, hash21(vec2(floor(g), lane + 11.0))) * smoothstep(0.5, 0.1, abs(fract(g) - 0.5)) * exp(-pow(lanes - lane, 2.0) * 14.0) * beam;
  float fade = mix(1.0, 0.5, along / L);
  vec3 colour = mix(WHITE, AZURE, smoothstep(0.0, L * 0.6, along));
  vec3 light = WHITE * spine * 1.5 + colour * beam * (0.55 + 1.5 * burst) + mix(AZURE, VIOLET, 0.4) * sheath * (0.35 + 0.25 * burst);
  light = light * span * fade * beat() + WHITE * grain * span * fade;
  // the base flares where the jet leaves the glare
  light += WHITE * exp(-along * 0.9) * exp(-(x * x) / (width * width * 2.0)) * 0.6 * beat();
  // where the jet ploughs into the gas around the galaxy it spreads into a lobe, with a hot spot
  vec2 lobe = vec2(along - L * 0.92, across) / vec2(5.6, 4.0);
  float spread = exp(-dot(lobe, lobe));
  float hot = exp(-dot(lobe * 4.0, lobe * 4.0));
  light += (AZURE * spread * 0.4 + WHITE * hot * 0.8) * beat();
  return light * bright * 1.2;
}
#endif

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;

  float camDist = length(uCam);
  vec3 dir = normalize(uFwd * (uScale * camDist) + uRight * q.x + uUp * q.y);
  vec3 across = cross(uCam, dir);

  vec3 light = vec3(0.0);
  float hidden = 0.0;
  bool captured = false;

  // Every ray is marched, the far ones in a few long steps: one rule for the whole sky, so the
  // stars are bent smoothly from the edge of the frame to the edge of the shadow.
  vec3 p = uCam;
  vec3 v = dir;
  float h2 = dot(across, across);
  int steps = uSteps;
#ifdef QUASAR
  if (length(q) > uMarch) steps = 0; // far from the hole the light runs straight
#endif
  {
    for (int i = 0; i < ${MAX_STEPS}; i++) {
      if (i >= steps) { captured = dot(p, p) < 6.0; break; }
      float r2 = dot(p, p);
      float r = sqrt(r2);
      if (r < 1.0) { captured = true; break; }
      if (r > R_FAR && dot(p, v) > 0.0) break;
      float dt = uStride * max(r - 0.55, 0.3);
      v += -1.5 * h2 * p / (r2 * r2 * r) * dt;
      vec3 next = p + v * dt;
      if (p.y * next.y < 0.0 && hidden < 0.98) {
        vec3 hit = mix(p, next, p.y / (p.y - next.y));
        vec4 d = disc(hit, normalize(v));
        light += (1.0 - hidden) * d.rgb * d.a;
        hidden += (1.0 - hidden) * d.a;
      }
      p = next;
    }
  }
  vec3 outDir = normalize(v);
#ifdef QUASAR
  // past the marched zone the light runs straight: blend into it, so the sky shows no seam
  outDir = normalize(mix(outDir, dir, smoothstep(uMarch * 0.55, uMarch, length(q))));
#endif
  light += (1.0 - hidden) * (captured ? SHADOW : skyDeep(outDir, SKY_RICH));

#ifdef QUASAR
  vec2 u = q / uScale; // horizon radii from the hole, y up
  light += (1.0 - hidden * 0.7) * hostGalaxy(u);
  float along = dot(u, uJetDir);
  float acrossJet = u.x * uJetDir.y - u.y * uJetDir.x;
  light += jet(along, acrossJet, 1.0);                       // toward us: beamed brighter
  light += (1.0 - hidden) * jet(-along, acrossJet, 0.2);     // away from us, partly behind the disc
  // the core outshines everything around it
  float rc = length(u);
  light += WHITE * (2.2 / (1.0 + rc * rc * 0.35) + 0.08 / (1.0 + rc * 0.1)) * (0.75 + 0.3 * beat());
  light = 1.0 - exp(-light * 1.15); // keep the glare from clipping flat
#endif

  gl_FragColor = vec4(light, 1.0);
}
`;
