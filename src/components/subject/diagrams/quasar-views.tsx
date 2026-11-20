import styles from "./diagrams.module.css";

/*
  A quasar's engine seen side on, and two lines of sight onto it. Flat, bold shapes
  (DESIGN_SPEC.md 8). The drawing carries only numbers: what each number means is the legend in
  the subject's own file.

  1 black hole and accretion disc, 2 the donut of cold gas and dust (its outline long-dashed: it
  is a model, D-075), 3 jets, 4 a line of sight straight down a jet, 5 one close to it.
*/

const X = 300;
const Y = 132;

/** A jet: narrow at the hole, widening outward, to `tip` (above the hole when negative). */
function jet(tip: number): string {
  const sign = Math.sign(tip);
  const base = Y + sign * 6;
  return `M${X - 3} ${base} L${X - 13} ${Y + tip} Q${X} ${Y + tip + sign * 10} ${X + 13} ${Y + tip} L${X + 3} ${base} Z`;
}

/** A line of sight: from `from` toward the hole, stopping short of it, with an arrowhead. */
function sight(fx: number, fy: number, stop: number): { line: string; head: string } {
  const dx = X - fx;
  const dy = Y - fy;
  const length = Math.hypot(dx, dy);
  const ux = dx / length;
  const uy = dy / length;
  const ex = fx + ux * (length - stop);
  const ey = fy + uy * (length - stop);
  const head = `M${(ex - ux * 9 - uy * 4).toFixed(1)} ${(ey - uy * 9 + ux * 4).toFixed(1)} L${ex.toFixed(1)} ${ey.toFixed(1)} L${(ex - ux * 9 + uy * 4).toFixed(1)} ${(ey - uy * 9 - ux * 4).toFixed(1)}`;
  return { line: `M${fx} ${fy} L${ex.toFixed(1)} ${ey.toFixed(1)}`, head };
}

const BADGES: readonly { n: number; x: number; y: number; to?: readonly [number, number] }[] = [
  { n: 1, x: 120, y: 214, to: [258, 136] },
  { n: 2, x: 120, y: 62, to: [196, 112] },
  { n: 3, x: 196, y: 24, to: [288, 40] },
  { n: 4, x: 338, y: 10 },
  { n: 5, x: 400, y: 10 },
];

export function QuasarViews() {
  const down = sight(336, 24, 52);
  const near = sight(392, 22, 44);
  return (
    <svg className={styles.drawing} viewBox="40 -8 520 272" role="img" aria-label="Diagram of a quasar's engine seen side on, with two lines of sight, numbered one to five and explained in the list that follows.">
      {/* 3: the jets, out of both faces of the disc */}
      <path className={styles.quasarJet} d={jet(-118)} />
      <path className={styles.quasarJet} d={jet(118)} />

      {/* 2: the donut of cold gas and dust, cut through: a model, so its outline is long-dashed */}
      <ellipse className={styles.quasarTorus} cx={X - 112} cy={Y} rx="50" ry="34" />
      <ellipse className={styles.quasarTorus} cx={X + 112} cy={Y} rx="50" ry="34" />

      {/* 1: the accretion disc, hottest at its inner edge, and the hole */}
      <ellipse className={styles.quasarDisc} cx={X} cy={Y} rx="64" ry="7" />
      <ellipse className={styles.quasarDiscInner} cx={X} cy={Y} rx="30" ry="4.5" />
      <circle className={styles.quasarHole} cx={X} cy={Y} r="5.5" />

      {/* 4 and 5: lines of sight onto the engine */}
      <path className={styles.sight} d={down.line} />
      <path className={styles.sight} d={down.head} />
      <path className={styles.sight} d={near.line} />
      <path className={styles.sight} d={near.head} />

      {BADGES.map((badge) => (
        <g key={badge.n}>
          {badge.to ? <line className={styles.leader} x1={badge.x} y1={badge.y} x2={badge.to[0]} y2={badge.to[1]} /> : null}
          <circle className={styles.badge} cx={badge.x} cy={badge.y} r="13" />
          <text className={styles.number} x={badge.x} y={badge.y} dy="0.36em" textAnchor="middle">
            {badge.n}
          </text>
        </g>
      ))}
    </svg>
  );
}
