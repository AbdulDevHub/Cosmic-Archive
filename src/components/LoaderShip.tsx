import type { ShipClass } from "@/lib/ship";

/*
  The first-load screen's ship (D-123): the visitor's chosen class, seen from above, nose to the
  right, its engines lit and trailing light. Flat silhouettes after the fleet's shapes (D-120), in
  each class's colours; plain SVG, no three.
*/

/** An engine's light: its trail's hot start, the trail's colour, the glow's colour, and what both fade into. */
type Flame = [string, string, string, string];
type Look = { hull: [string, string]; trim?: string; engines: [number, number][]; flame?: Flame; body: React.ReactNode };

const BLUE: Flame = ["#bfe2ff", "#5aa8ff", "#9fd2ff", "#3a6cff"];

const LOOKS: Record<ShipClass, Look> = {
  sovereign: {
    hull: ["#eef2fb", "#9aa6bd"],
    engines: [[12, 13], [12, 47]],
    body: (
      <>
        <path d="M34 22 L60 27 L60 33 L34 38 Z" />
        <rect x="12" y="10.5" width="40" height="5" rx="2.5" />
        <rect x="12" y="44.5" width="40" height="5" rx="2.5" />
        <path d="M38 27 L44 15 L48 15 L44 27 Z M38 33 L44 45 L48 45 L44 33 Z" />
        <ellipse cx="44" cy="30" rx="20" ry="5.5" />
        <ellipse cx="84" cy="30" rx="27" ry="23" />
        <ellipse cx="84" cy="30" rx="17" ry="14" fill="none" stroke="#5d6a85" strokeWidth="0.8" />
        <circle cx="85" cy="30" r="4" fill="#cfd8ea" />
      </>
    ),
  },
  predator: {
    hull: ["#4a505c", "#22252c"],
    engines: [[18, 27], [18, 33], [26, 22], [26, 38]],
    body: (
      <>
        <path d="M118 27 L100 30 L118 33 L96 36 L70 38 L30 37 L20 34 L20 26 L30 23 L70 22 L96 24 Z" />
        <path d="M82 23 Q78 4 8 2 L11 5 Q46 10 40 23 Z M82 37 Q78 56 8 58 L11 55 Q46 50 40 37 Z" />
        <path d="M80 21 Q75 5 16 3 M80 39 Q75 55 16 57" fill="none" stroke="#6fb6ff" strokeWidth="0.9" />
      </>
    ),
  },
  celestial: {
    // D-210: a fine bow with manta wings, shells round a gold-filled loop, a fan of six pods
    hull: ["#fbf8f1", "#d6d0c4"],
    trim: "#e0b45a",
    engines: [[6, 22.4], [6, 37.6], [10.3, 10.2], [10.3, 49.8], [8.8, 18.6], [8.8, 41.4]],
    flame: ["#d9e0ff", "#7f8cff", "#b4c0ff", "#5a5cff"],
    body: (
      <>
        <path d="M92 25 Q79 15 60 6 Q66 15 62 25 Z M92 35 Q79 45 60 54 Q66 45 62 35 Z" />
        <ellipse cx="44" cy="30" rx="27" ry="19" />
        {[10.2, 49.8, 18.6, 41.4, 22.4, 37.6].map((y, i) => (
          <ellipse key={y} cx={i < 2 ? 31 : i < 4 ? 29.5 : 28.5} cy={y} rx={i < 2 ? 21 : i < 4 ? 20.5 : 23} ry="3.6" />
        ))}
        <path d="M117 30 Q90 24 62 20 L58 30 L62 40 Q90 36 117 30 Z" />
        <ellipse cx="49" cy="30" rx="16.5" ry="11.4" />
        <ellipse cx="49" cy="30" rx="11.5" ry="7.4" fill="#e0b45a" />
        <ellipse cx="88" cy="30" rx="5" ry="1.4" fill="#1b2340" />
      </>
    ),
  },
  discovery: {
    // D-210: a faceted cream shuttle behind a charcoal snout, four round pods banded orange, swept wings
    hull: ["#fbf3e2", "#cbbfa6"],
    engines: [[25.4, 17.4], [25.4, 42.6], [38.4, 7.7], [38.4, 52.3]],
    flame: ["#ffe2bf", "#ff9a3a", "#ffc27a", "#ff6a1a"],
    body: (
      <>
        <path d="M67 37 L54 54.5 L38.4 59.5 L33.4 58.1 L38.4 37 Z M67 23 L54 5.5 L38.4 0.5 L33.4 1.9 L38.4 23 Z" />
        <path d="M44 51 L33.4 58.1 L38.4 59.5 Z M44 9 L33.4 1.9 L38.4 0.5 Z" fill="#f08c24" />
        <rect x="38.4" y="2.7" width="21.6" height="10" rx="3" />
        <rect x="38.4" y="47.3" width="21.6" height="10" rx="3" />
        <rect x="27" y="20.6" width="48" height="18.8" rx="3" />
        <rect x="25.4" y="12.4" width="21.6" height="10" rx="3" />
        <rect x="25.4" y="37.6" width="21.6" height="10" rx="3" />
        {[[46.3, 2.7], [46.3, 47.3], [33.3, 12.4], [33.3, 37.6]].map(([x, y]) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="5.8" height="10" fill="#f08c24" />
        ))}
        <path d="M74 20.5 L88 21.5 L95 25 L98 30 L95 35 L88 38.5 L74 39.5 Z" fill="#55565c" />
        <ellipse cx="76" cy="30" rx="11.5" ry="3.1" fill="#121826" />
        <path d="M53 30 L49.5 25.7 L41 25.7 L44 30 L41 34.3 L49.5 34.3 Z" fill="#f08c24" />
        <rect x="27" y="24.3" width="18.6" height="1.6" fill="#f08c24" />
        <rect x="27" y="34.1" width="18.6" height="1.6" fill="#f08c24" />
      </>
    ),
  },
  colossus: {
    hull: ["#8f9bb2", "#3a4561"],
    engines: [[10, 22], [10, 27], [10, 33], [10, 38]],
    body: (
      <>
        <path d="M118 30 L96 14 L40 10 L16 15 L10 22 L10 38 L16 45 L40 50 L96 46 Z" />
        <path d="M104 30 L88 19 L30 17 L18 23 L18 37 L30 43 L88 41 Z" fill="#26304a" />
        {[86, 70, 54, 38].map((x) => (
          <path key={x} d={`M${x + 8} 30 L${x - 2} 21 L${x - 8} 21 L${x} 30 L${x - 8} 39 L${x - 2} 39 Z`} fill="#9aa6bd" />
        ))}
      </>
    ),
  },
};

/** A ship alone, its hull in its own colours, for the start page's ship dock (D-201). */
export function ShipSilhouette({ ship, width = 64 }: { ship: ShipClass; width?: number }) {
  const look = LOOKS[ship];
  const id = `ship-hull-${ship}`;
  return (
    <svg viewBox="0 0 120 60" width={width} height={width / 2} aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.hull[0]} />
          <stop offset="1" stopColor={look.hull[1]} />
        </linearGradient>
      </defs>
      <g fill={`url(#${id})`} stroke={look.trim ?? "none"} strokeWidth={look.trim ? 0.9 : 0}>
        {look.body}
      </g>
      {look.engines.map(([x, y]) => (
        <circle key={`${x}-${y}`} cx={x} cy={y} r="3.6" fill={look.flame ? look.flame[2] : "#8fcaff"} />
      ))}
    </svg>
  );
}

export function LoaderShip({ ship }: { ship: ShipClass }) {
  const look = LOOKS[ship];
  const [core, trail, glow, edge] = look.flame ?? BLUE;
  return (
    <svg viewBox="-60 0 180 60" width="300" height="100" aria-hidden="true">
      <defs>
        <linearGradient id="loader-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.hull[0]} />
          <stop offset="1" stopColor={look.hull[1]} />
        </linearGradient>
        <linearGradient id="loader-trail" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor={core} stopOpacity="0.95" />
          <stop offset="0.25" stopColor={trail} stopOpacity="0.55" />
          <stop offset="1" stopColor={edge} stopOpacity="0" />
        </linearGradient>
        <radialGradient id="loader-glow">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor={glow} />
          <stop offset="1" stopColor={edge} stopOpacity="0" />
        </radialGradient>
      </defs>
      <g data-trails>
        {look.engines.map(([x, y]) => (
          <rect key={`t${x}-${y}`} x={x - 70} y={y - 1.6} width="70" height="3.2" rx="1.6" fill="url(#loader-trail)" />
        ))}
      </g>
      <g fill="url(#loader-hull)" stroke={look.trim ?? "none"} strokeWidth={look.trim ? 0.9 : 0}>
        {look.body}
      </g>
      <g data-engines>
        {look.engines.map(([x, y]) => (
          <circle key={`g${x}-${y}`} cx={x} cy={y} r="4.5" fill="url(#loader-glow)" />
        ))}
      </g>
    </svg>
  );
}
