import styles from "./diagrams.module.css";

/*
  Five galaxy shapes side by side, face on except the lenticular, which is shown tilted so its
  disc and bulge read without arms. Flat, bold shapes (DESIGN_SPEC.md 8). The drawing carries only
  numbers: what each number means is the legend in the subject's own file.

  1 spiral, 2 barred spiral, 3 lenticular, 4 elliptical, 5 irregular.
*/

const CENTRES = [72, 216, 360, 504, 648] as const;
const MID = 104;

/** One logarithmic spiral arm from radius `r0` to `r1`, starting at angle `a0`, as an SVG path. */
function arm(cx: number, cy: number, a0: number, r0: number, r1: number, wind: number): string {
  const points: string[] = [];
  for (let i = 0; i <= 28; i++) {
    const r = r0 * Math.pow(r1 / r0, i / 28);
    const a = a0 + wind * Math.log(r / r0);
    points.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${points.join(" L")}`;
}

const [S, B, L, E, I] = CENTRES;

export function GalaxyTypes() {
  return (
    <svg className={styles.drawing} viewBox="0 36 720 196" role="img" aria-label="Diagram of five galaxy shapes, numbered one to five and explained in the list that follows.">
      {/* 1: spiral, a disc with two arms around a bulge */}
      <circle className={styles.galaxyDisc} cx={S} cy={MID} r="56" />
      <path className={styles.galaxyArm} d={arm(S, MID, 0, 9, 52, 1.7)} />
      <path className={styles.galaxyArm} d={arm(S, MID, Math.PI, 9, 52, 1.7)} />
      <circle className={styles.galaxyBulge} cx={S} cy={MID} r="11" />

      {/* 2: barred spiral, the arms start at the ends of a bar */}
      <circle className={styles.galaxyDisc} cx={B} cy={MID} r="56" />
      <path className={styles.galaxyArm} d={arm(B, MID, 0, 24, 52, 2.0)} />
      <path className={styles.galaxyArm} d={arm(B, MID, Math.PI, 24, 52, 2.0)} />
      <rect className={styles.galaxyBar} x={B - 26} y={MID - 5} width="52" height="10" rx="5" />
      <circle className={styles.galaxyBulge} cx={B} cy={MID} r="10" />

      {/* 3: lenticular, disc and bulge, tilted, no arms */}
      <ellipse className={styles.galaxyDisc} cx={L} cy={MID} rx="60" ry="17" />
      <ellipse className={styles.galaxyOld} cx={L} cy={MID} rx="44" ry="10" />
      <ellipse className={styles.galaxyBulge} cx={L} cy={MID} rx="17" ry="13" />

      {/* 4: elliptical, an oval of old stars, brightest at the centre */}
      <ellipse className={styles.galaxyOld} cx={E} cy={MID} rx="52" ry="36" opacity="0.45" />
      <ellipse className={styles.galaxyOld} cx={E} cy={MID} rx="34" ry="23" opacity="0.7" />
      <ellipse className={styles.galaxyBulge} cx={E} cy={MID} rx="16" ry="11" />

      {/* 5: irregular, loose clumps with no order */}
      <path className={styles.galaxyDisc} d={`M${I - 44} ${MID + 18} C${I - 58} ${MID - 20} ${I - 18} ${MID - 52} ${I + 14} ${MID - 34} C${I + 52} ${MID - 40} ${I + 56} ${MID + 6} ${I + 30} ${MID + 26} C${I + 10} ${MID + 50} ${I - 30} ${MID + 44} ${I - 44} ${MID + 18} Z`} />
      <circle className={styles.galaxyKnot} cx={I - 20} cy={MID - 8} r="9" />
      <circle className={styles.galaxyKnot} cx={I + 16} cy={MID - 18} r="6" />
      <circle className={styles.galaxyKnot} cx={I + 24} cy={MID + 12} r="7" />
      <circle className={styles.galaxyBulge} cx={I - 4} cy={MID + 14} r="5" />

      {CENTRES.map((x, index) => (
        <g key={x}>
          <circle className={styles.badge} cx={x} cy="212" r="13" />
          <text className={styles.number} x={x} y="212" dy="0.36em" textAnchor="middle">
            {index + 1}
          </text>
        </g>
      ))}
    </svg>
  );
}
