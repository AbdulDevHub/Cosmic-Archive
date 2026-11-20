import styles from "./diagrams.module.css";

/*
  Five kinds of nebula side by side, each with the star that makes it what it is. Flat, bold
  shapes (DESIGN_SPEC.md 8). The drawing carries only numbers: what each number means is the
  legend in the subject's own file.

  1 emission, 2 reflection, 3 dark, 4 planetary nebula, 5 supernova remnant.
*/

const CENTRES = [72, 216, 360, 504, 648] as const;
const MID = 104;

/** A closed, lumpy outline around (cx, cy): `bumps` lobes on a circle of radius r. */
function blob(cx: number, cy: number, r: number, bumps: number, depth: number, turn: number): string {
  const points: string[] = [];
  for (let i = 0; i < 48; i++) {
    const a = (i / 48) * Math.PI * 2;
    const rr = r * (1 + depth * Math.sin(bumps * a + turn) + depth * 0.5 * Math.sin((bumps + 3) * a + turn * 2));
    points.push(`${(cx + rr * Math.cos(a)).toFixed(1)} ${(cy + rr * Math.sin(a)).toFixed(1)}`);
  }
  return `M${points.join(" L")} Z`;
}

/** Short broken strokes radiating out from (cx, cy), as an exploded shell's filaments. */
function filaments(cx: number, cy: number): string {
  const strokes: string[] = [];
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2 + (i % 3) * 0.07;
    const r0 = 30 + (i % 4) * 4;
    const r1 = r0 + 14 + (i % 5) * 3;
    strokes.push(`M${(cx + r0 * Math.cos(a)).toFixed(1)} ${(cy + r0 * Math.sin(a)).toFixed(1)} L${(cx + r1 * Math.cos(a + 0.05)).toFixed(1)} ${(cy + r1 * Math.sin(a + 0.05)).toFixed(1)}`);
  }
  return strokes.join(" ");
}

const [EM, RE, DA, PL, SN] = CENTRES;

export function NebulaKinds() {
  return (
    <svg className={styles.drawing} viewBox="0 36 720 196" role="img" aria-label="Diagram of five kinds of nebula, numbered one to five and explained in the list that follows.">
      {/* 1: emission, a glowing cloud around the hot young star that lights it */}
      <path className={styles.nebulaGas} d={blob(EM, MID, 50, 5, 0.12, 0.4)} />
      <path className={styles.nebulaGasInner} d={blob(EM, MID, 28, 4, 0.14, 1.3)} />
      <circle className={styles.nebulaStar} cx={EM} cy={MID} r="6" />

      {/* 2: reflection, dust beside a star, lit blue by the starlight it scatters */}
      <path className={styles.nebulaReflect} d={blob(RE + 8, MID + 4, 46, 4, 0.13, 2.1)} />
      <circle className={styles.nebulaStar} cx={RE - 34} cy={MID - 30} r="7" />

      {/* 3: dark, dust thick enough to block the glow behind it */}
      <path className={styles.nebulaGas} d={blob(DA, MID, 52, 6, 0.08, 0.9)} />
      <path className={styles.nebulaDark} d={`M${DA - 30} ${MID + 60} C${DA - 26} ${MID + 20} ${DA - 18} ${MID} ${DA - 10} ${MID - 22} C${DA - 4} ${MID - 40} ${DA + 14} ${MID - 38} ${DA + 12} ${MID - 18} C${DA + 10} ${MID} ${DA + 20} ${MID + 24} ${DA + 26} ${MID + 60} Z`} />

      {/* 4: planetary nebula, a dying Sun-like star's cast-off layers around its core */}
      <ellipse className={styles.nebulaShell} cx={PL} cy={MID} rx="44" ry="36" />
      <ellipse className={styles.nebulaShellInner} cx={PL} cy={MID} rx="26" ry="20" />
      <circle className={styles.nebulaCore} cx={PL} cy={MID} r="4" />

      {/* 5: supernova remnant, the torn shell of an exploded star, its dense core at the centre */}
      <path className={styles.nebulaFilament} d={filaments(SN, MID)} />
      <circle className={styles.nebulaCore} cx={SN} cy={MID} r="3" />

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
