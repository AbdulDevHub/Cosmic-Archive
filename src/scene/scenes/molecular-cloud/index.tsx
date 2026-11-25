/**
 * A molecular cloud (D-148): our own illustration of a cold cloud of gas and dust where stars are
 * born, the first stage of A Star's Life. Smoky umber pillars of dust rise from a dark bank below,
 * their tops eaten ragged and rimmed with ember light from hot young stars above the frame; behind
 * them, glowing steel-blue gas. Deep in the pillars' tips, baby stars burn through the dust as
 * ember-red points, a few throwing thin jets out of both poles. The dust drifts very slowly; a drag
 * looks round it, the pillars moving more than the gas behind, and the baby stars staying in their
 * pillars (D-196: they drifted off them). D-196 also gave it depth: the pillars are shaded as
 * solid columns lit from above and to the left, their heads boil off in glowing gold streamers,
 * a few hot young stars blaze just above the frame, the gas behind billows with lit edges, and a
 * dark wisp of nearer dust drifts across a corner. One draw call, no particles. Its
 * own colour family: umber, ember and steel blue. Mounted by the host through the registry; never
 * imported by a page.
 */

import type { SceneBudget, SceneProps } from "../../host/types";
import { SKY_CHUNK } from "../../shaders/sky.glsl";
import { ORB_COMMON, useOrbScene, type OrbConfig } from "../shared/orb";

export const budget: SceneBudget = {
  drawCalls: 1,
  particles: { low: 0, medium: 0, high: 0 }, // no particles: the cost is per pixel
};

const FRAGMENT = /* glsl */ `
${ORB_COMMON}
#define SKY_LAYERS 3
${SKY_CHUNK}

const vec3 STEEL = vec3(0.32, 0.5, 0.78);
const vec3 TEAL_GAS = vec3(0.3, 0.62, 0.7);
const vec3 UMBER = vec3(0.2, 0.12, 0.08);
const vec3 EMBER = vec3(1.0, 0.5, 0.22);
const vec3 GOLD = vec3(1.0, 0.8, 0.5);

/* a pillar's foot, lean and top (x at the bottom of the frame, x drift per unit of height, top y) */
vec3 pillar(int i){
  float fi = float(i);
  return vec3(-0.78 + fi * 0.74 + 0.1 * sin(fi * 2.3), 0.16 * (fi - 1.0), 0.18 + 0.32 * sin(fi * 1.7 + 0.4));
}
float pillarX(vec3 pl, float y){ return pl.x + pl.y * (y + 1.0); }

/* how thick the dust is at a point: a bank below, three tapering pillars rising from it, ragged everywhere */
float dust(vec2 p, float t){
  vec2 w = p + 0.06 * vec2(fbm3(vec3(p * 3.0, 1.0)), fbm3(vec3(p * 3.0, 5.0))) - 0.03;
  float ragged = fbm3(vec3(w * 3.2, t * 0.004));
  float fine = fbm3(vec3(w * 11.0, 2.0));
  float bank = smoothstep(-0.45, -0.95, w.y + 0.25 * (ragged - 0.5));
  float pillars = 0.0;
  for (int i = 0; i < 3; i++) {
    vec3 pl = pillar(i);
    float top = pl.z;
    // wide at the foot, narrowing to a knobbly head
    float rise = clamp((top - w.y) / (top + 1.0), 0.0, 1.0);
    float width = (0.09 + 0.03 * float(i)) * (0.75 + 1.6 * rise);
    float x = abs(w.x - pillarX(pl, w.y)) / width + 0.45 * (ragged - 0.5) + 0.18 * (fine - 0.5);
    float body = smoothstep(1.05, 0.5, x);
    // a rounded, knobbly head: lower toward the sides
    float dome = 0.55 * width * x * x;
    float cap = smoothstep(top + 0.05, top - 0.08, w.y + dome + 0.26 * (ragged - 0.5) + 0.1 * (fine - 0.5));
    pillars = max(pillars, body * cap);
  }
  return clamp(max(bank, pillars) * (0.6 + 0.8 * fine), 0.0, 1.3);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the frame's half height is about 1, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  vec2 look = vec2(uYaw, -uPitch) * 0.25;

  vec2 v = (css - size * 0.5) / size.y;
  vec3 col = skyDeep(normalize(vec3(v * 1.4, -1.0)), 0.4) * 0.5;

  // ---- the glowing gas behind, lit from above: billows whose upper edges catch the light ----
  vec2 g = u + look * 0.4;
  float gas = fbm3(vec3(g * 1.1, 2.0 + t * 0.003));
  float gasUp = fbm3(vec3((g + vec2(0.0, 0.04)) * 1.1, 2.0 + t * 0.003));
  float wisp = fbm3(vec3(g * 3.0 + gas, 4.0));
  float light = smoothstep(-1.2, 1.0, g.y);
  float edgeLit = clamp((gas - gasUp) * 9.0, 0.0, 1.0);
  col += mix(STEEL, TEAL_GAS, wisp) * (0.1 + 1.3 * gas * gas * gas * 1.6) * (0.35 + 1.0 * light);
  col += mix(TEAL_GAS, GOLD, 0.5) * edgeLit * light * 0.35;
  col += GOLD * 0.26 * exp(-pow((g.x - 0.2) / 0.9, 2.0)) * smoothstep(0.0, 1.3, g.y);
  // the hot young stars that light it all, blazing high in the frame
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    vec2 sp = (k == 0 ? vec2(-0.45, 0.48) : (k == 1 ? vec2(0.45, 0.52) : vec2(1.0, 0.35))) - look * 0.4;
    vec2 se = (u - sp) * uScale;
    float sr = length(se);
    float bright = 1.0 - 0.3 * fk;
    col += vec3(0.85, 0.92, 1.0) * (exp(-sr * sr / 20.0) * 1.6 + exp(-sr / 60.0) * 0.3 + exp(-sr / 220.0) * 0.12) * bright;
    // faint spikes, as a lens would draw them
    col += vec3(0.8, 0.9, 1.0) * (exp(-abs(se.x) / 1.5) * exp(-abs(se.y) / 70.0) + exp(-abs(se.y) / 1.5) * exp(-abs(se.x) / 70.0)) * 0.3 * bright;
  }

  // ---- the dust, in front, and the light caught on its edges ----
  vec2 p = u + look;
  float d = dust(p, t);
  float above = dust(p + vec2(0.0, 0.012), t);      // the dust just toward the light
  float toLight = dust(p + vec2(-0.035, 0.035), t);  // further toward it, for the columns' round shading
  float rim = clamp((d - above) * 5.0, 0.0, 1.0) * smoothstep(0.2, 0.5, d) * (1.0 - smoothstep(0.7, 1.1, d));
  float through = exp(-max(d - 0.25, 0.0) * 3.5);
  col *= through;
  // the columns' bodies: brighter where they face the light, deep brown where they turn away
  float facing = clamp((d - toLight) * 3.0 + 0.35, 0.0, 1.0);
  float grit = fbm3(vec3(p * 5.0, 8.0));
  vec3 lit = mix(UMBER * 0.45, mix(UMBER * 3.4, EMBER * 0.9, 0.4), facing * facing);
  col += lit * smoothstep(0.3, 0.9, d) * (0.4 + 0.8 * grit) * 0.65;
  col += mix(EMBER, GOLD, 0.4) * rim * 1.1;

  // ---- the heads boil off: gold streamers of gas rising from each pillar's top ----
  for (int i = 0; i < 3; i++) {
    vec3 pl = pillar(i);
    float above_ = p.y - pl.z;
    float dx = p.x - pillarX(pl, pl.z);
    float spread = 0.1 + 0.25 * max(above_, 0.0);
    float streak = fbm3(vec3(dx * 9.0 / (1.0 + above_ * 2.0), (p.y - t * 0.015) * 3.0, float(i) * 5.0));
    float plume = exp(-dx * dx / (spread * spread)) * smoothstep(-0.06, 0.04, above_) * exp(-max(above_, 0.0) * 3.2);
    col += mix(EMBER, GOLD, 0.6) * plume * smoothstep(0.35, 0.8, streak) * (1.0 - smoothstep(0.3, 0.7, d)) * 0.9;
  }

  // ---- baby stars burning through the pillars' tips, a few with jets ----
  for (int i = 0; i < 4; i++) {
    float fi = float(i);
    // just inside each pillar's head, and one more low in the middle pillar
    vec3 pl = pillar(i < 3 ? i : 1);
    float y = i < 3 ? pl.z - 0.12 : pl.z - 0.55;
    // the dust is drawn at u + look, so a point fixed in the dust sits at its place minus look
    vec2 at = vec2(pillarX(pl, y) + (i < 3 ? 0.0 : 0.03), y) - look;
    vec2 e = u - at;
    float r = length(e) * uScale;                      // CSS pixels
    float burn = 0.75 + 0.25 * sin(t * (0.6 + fi * 0.2) + fi);
    col += EMBER * (exp(-r * r / 40.0) * 1.1 + exp(-r / 30.0) * 0.35) * burn;
    col += vec3(1.0, 0.9, 0.8) * exp(-r * r / 6.0);
    if (i == 0 || i == 3) {
      // twin jets, along a tilted axis
      float ang = 1.3 + fi * 0.5;
      vec2 ax = vec2(cos(ang), sin(ang));
      float along = abs(dot(e, ax)) * uScale;
      float across = abs(dot(e, vec2(-ax.y, ax.x))) * uScale;
      float jet = exp(-across * across / (6.0 + along * 0.5)) * exp(-along / 16.0) * smoothstep(3.0, 9.0, along);
      col += mix(EMBER, GOLD, 0.5) * jet * 0.4;
    }
  }

  // ---- a dark wisp of nearer dust across the lower right corner, moving most in a drag ----
  vec2 nf = u + look * 1.8;
  float near = smoothstep(0.45, 0.75, fbm3(vec3(nf * 1.6 + vec2(t * 0.004, 0.0), 21.0))) * smoothstep(0.2, 1.2, nf.x - nf.y * 0.6);
  col *= 1.0 - 0.85 * near;
  col += EMBER * 0.05 * near * smoothstep(0.6, 0.0, near);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.9);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.max(height, width * 0.62) * 0.5,
  close: 1.4,
  arriveFrom: 0.5,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function MolecularCloudScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
