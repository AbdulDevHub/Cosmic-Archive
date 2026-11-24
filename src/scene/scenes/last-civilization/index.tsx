/**
 * The Last Civilization (D-189): our own illustration of Freeman Dyson's "Time without end" (1979),
 * a megastructure idea in A Quasar Galaxy, after Kurzgesagt's "We Found a Loophole to Survive the End
 * of the Universe". Near the end of time, a civilization wraps a dim white dwarf, one of the last
 * stars, in a dark shell of panels, and lives on a finite store of energy by hibernating: it sleeps
 * almost always, and wakes ever more rarely. The shell is near black, lit only at its rim by the cold
 * blue-white star inside, whose light shows through its seams and open panels. Round its waist a
 * thin ring, the store, glows cyan and slowly fills while they sleep. Now and then the civilization
 * wakes: its windows burn amber across the shell for a moment and the store dims as it spends; the
 * gaps between wakings grow longer, then the cycle starts over. The sky around is all but empty.
 * One full-screen shader, one draw call, no particles. Its own colour family: cold white-blue, black
 * steel, cyan and amber.
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
#define SKY_LAYERS 4
${SKY_CHUNK}

const vec3 DWARF = vec3(0.78, 0.86, 1.0);
const vec3 STEEL = vec3(0.045, 0.05, 0.065);
const vec3 CYAN = vec3(0.35, 0.9, 1.0);
const vec3 AMBER = vec3(1.0, 0.66, 0.3);
const float R = 0.62;        // the shell's radius
const float RING = 0.9;      // the store's radius, round the shell's waist
const float CYCLE = 34.0;

/* how awake the civilization is at cycle time c: four wakings, each further from the last */
float awake(float c){
  float w = 0.0;
  w += smoothstep(0.6, 1.0, c) * smoothstep(2.6, 1.9, c);
  w += smoothstep(5.0, 5.5, c) * smoothstep(7.6, 6.8, c);
  w += smoothstep(10.6, 11.2, c) * smoothstep(14.2, 13.2, c);
  w += smoothstep(22.0, 22.7, c) * smoothstep(26.4, 25.2, c);
  return w;
}

/* the shell's frame: it turns slowly, and with the drag */
mat3 frame(){
  return turnX(0.35 + uPitch * 0.6) * turnY(uYaw + uTime * 0.01);
}

/* the shell at point p (its own frame): 1 on a panel, 0 in a seam or an open panel; the panel's id,
   and how near a seam the point is (1 on it), for the light that leaks there */
float panel(vec3 p, out vec3 id, out float seamLight){
  vec3 g = p * 6.5;
  id = floor(g);
  vec3 f = fract(g);
  vec3 e = min(f, 1.0 - f);
  float seam = min(min(e.x, e.y), e.z);
  seamLight = exp(-seam / 0.02);
  float open = step(0.94, hash3(id + 3.0));
  return smoothstep(0.012, 0.03, seam) * (1.0 - open);
}

void main(){
  vec2 css = vec2(gl_FragCoord.x, uResolution.y - gl_FragCoord.y) / uDpr;
  vec2 q = css - uCentre;
  q.y = -q.y;
  vec2 u = q / uScale;     // the shell's radii, y up
  float t = uTime;
  vec2 size = uResolution / uDpr;
  // the end of time: a near-empty sky
  vec3 col = skyDeep(normalize(vec3((css - size * 0.5) / size.y * 1.3, -1.0)), 0.4) * 0.22;

  float c = mod(t + 0.5, CYCLE);   // the poster frame (t = 12) catches them awake
  float wake = awake(c);
  // the store fills while they sleep and drains as they wake
  float store = 0.55 + 0.35 * sin(c / CYCLE * 6.2832 * 3.0 - 1.0) * (1.0 - wake) - 0.3 * wake;

  mat3 m = frame();
  float r = length(u);
  float dwarfGlow = exp(-r / 0.025) * 1.3 + exp(-r / 0.11) * 0.18;

  // the store: a thin ring round the shell's waist (its plane is the shell's equator)
  vec3 n = transpose(m) * vec3(0.0, 1.0, 0.0);   // the equator's normal, seen from the visitor
  float zRing = abs(n.z) > 1e-3 ? -(u.x * n.x + u.y * n.y) / n.z : 0.0;
  vec3 pr = m * vec3(u, zRing);
  float ringD = abs(length(pr.xz) - RING);
  float ringLight = exp(-ringD / 0.008) * 0.9 + exp(-ringD / 0.04) * 0.12;
  float flow = 0.6 + 0.4 * sin(atan(pr.z, pr.x) * 6.0 - t * 1.5);
  vec3 ringCol = CYAN * ringLight * (0.25 + store) * flow;
  float shellZ = r < R ? sqrt(R * R - r * r) : -1e3;

  if (r < R) {
    vec3 front = m * vec3(u, shellZ);
    vec3 idF;
    float seamF;
    float onF = panel(front / R, idF, seamF);
    float fres = pow(1.0 - shellZ / R, 3.0);
    // the outside of a panel: black steel, a cold rim of starlight from behind, its seams leaking a
    // thin line of the star's light, and, when they wake, a scatter of amber windows
    vec3 shell = STEEL * (0.5 + 0.5 * fres) + DWARF * fres * 0.14;
    // asleep the seams leak cold starlight; awake they burn amber with the life inside
    shell += mix(DWARF * 0.1, AMBER * 0.45, wake) * seamF * (1.0 - fres * 0.7);
    vec3 g = front / R * 26.0;
    float lamp = step(0.7, hash3(floor(g) + 11.0)) * smoothstep(0.38, 0.1, length(fract(g) - 0.5));
    shell += AMBER * lamp * wake * (0.9 + 0.9 * hash3(floor(g) + 5.0));
    shell += AMBER * wake * 0.035;
    // through a seam or an open panel: the star, and the inner face of the far side, lit by it
    vec3 back = m * vec3(u, -shellZ);
    vec3 idB;
    float seamB;
    float onB = panel(back / R, idB, seamB);
    float near = exp(-r / 0.35);
    vec3 inside = DWARF * dwarfGlow + DWARF * onB * (0.05 + 0.3 * near) * (0.7 + 0.3 * hash3(idB)) + AMBER * onB * wake * 0.08;
    col = mix(inside + col * (1.0 - onB), shell, onF);
  } else {
    // round the shell, a faint halo of the star's light escaping through its seams
    col += DWARF * exp(-(r - R) / 0.05) * 0.06;
  }
  // the ring passes in front of the shell on its near side, behind it on its far side
  float ringInFront = step(shellZ, zRing);
  col += ringCol * mix(0.15, 1.0, ringInFront);

  col = col / (1.0 + max(col - 0.85, 0.0) * 0.85);
  gl_FragColor = vec4(col, 1.0);
}
`;

const CONFIG: OrbConfig = {
  fragment: FRAGMENT,
  framing: (width, height) => Math.min(width * 0.32, height * 0.44),
  close: 1.3,
  arriveFrom: 0.3,
  detail: { low: 0, medium: 1, high: 2 },
};

export default function LastCivilizationScene(props: SceneProps) {
  return <primitive object={useOrbScene(CONFIG, props)} />;
}
