import styles from "./diagrams.module.css";

/*
  A black hole and its disc, seen from the side and cut through the middle. Flat, bold shapes
  (DESIGN_SPEC.md 8). The drawing carries only numbers: what each number means is the legend in
  the subject's own file, so the facts stay in content/.

  1 event horizon, 2 shadow, 3 photon ring, 4 accretion disc, 5 jets, 6 singularity (theoretical,
  so its mark is in long dashes).
*/

const MARKS: readonly { n: number; x: number; y: number; to: [number, number] }[] = [
  { n: 1, x: 262, y: 300, to: [331, 239] },
  { n: 2, x: 262, y: 96, to: [318, 142] },
  { n: 3, x: 470, y: 96, to: [414, 150] },
  { n: 4, x: 610, y: 292, to: [566, 216] },
  { n: 5, x: 452, y: 34, to: [372, 46] },
  { n: 6, x: 470, y: 300, to: [366, 204] },
];

export function BlackHoleAnatomy() {
  return (
    <svg className={styles.drawing} viewBox="0 0 720 340" role="img" aria-label="Diagram of a black hole seen from the side, with six numbered parts explained in the list that follows.">
      {/* 5: the jets, straight up and down from the poles */}
      <path className={styles.jet} d="M360 148 L348 6 H372 Z" />
      <path className={styles.jet} d="M360 252 L348 334 H372 Z" />

      {/* 4: the disc, edge on: hottest next to the hole */}
      <path className={styles.discOuter} d="M40 200 L262 187 V213 Z" />
      <path className={styles.discMid} d="M150 200 L262 190 V210 Z" />
      <path className={styles.discInner} d="M214 200 L262 192 V208 Z" />
      <path className={styles.discOuter} d="M680 200 L458 187 V213 Z" />
      <path className={styles.discMid} d="M570 200 L458 190 V210 Z" />
      <path className={styles.discInner} d="M506 200 L458 192 V208 Z" />

      {/* 2: the shadow, about twice the size of the horizon; 3: the ring of light at its edge */}
      <circle className={styles.shadow} cx="360" cy="200" r="74" />
      <circle className={styles.photonRing} cx="360" cy="200" r="78" />

      {/* 1: the event horizon */}
      <circle className={styles.horizon} cx="360" cy="200" r="40" />

      {/* 6: the singularity, in theoretical ink */}
      <circle className={styles.singularity} cx="360" cy="200" r="7" />

      {MARKS.map((mark) => (
        <g key={mark.n}>
          <line className={styles.leader} x1={mark.x} y1={mark.y} x2={mark.to[0]} y2={mark.to[1]} />
          <circle className={styles.badge} cx={mark.x} cy={mark.y} r="13" />
          <text className={styles.number} x={mark.x} y={mark.y} dy="0.36em" textAnchor="middle">
            {mark.n}
          </text>
        </g>
      ))}
    </svg>
  );
}
