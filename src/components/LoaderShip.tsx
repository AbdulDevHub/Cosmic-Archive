import type { ShipClass } from "@/lib/ship";

/*
  The first-load screen's ship (D-123): the visitor's chosen class, seen from above, nose to the
  right, its engines lit and trailing light. Flat silhouettes after the fleet's shapes (D-120), in
  each class's colours; plain SVG, no three.
*/

type Look = { hull: [string, string]; trim?: string; engines: [number, number][]; body: React.ReactNode };

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
    hull: ["#fbf8f1", "#d6d0c4"],
    trim: "#e0b45a",
    engines: [[18, 27], [18, 33]],
    body: (
      <>
        <path d="M84 27 Q66 8 30 3 Q48 15 48 27 Z M84 33 Q66 52 30 57 Q48 45 48 33 Z" />
        <path d="M118 30 Q84 20 34 24 L22 30 L34 36 Q84 40 118 30 Z" />
        <ellipse cx="44" cy="30" rx="11" ry="13" fill="none" stroke="#e0b45a" strokeWidth="1.6" />
        <ellipse cx="84" cy="30" rx="13" ry="2.6" fill="#1b2340" />
      </>
    ),
  },
  discovery: {
    hull: ["#f3f6fb", "#b3bccb"],
    engines: [[16, 13], [16, 47]],
    body: (
      <>
        <path d="M52 22 L34 6 L28 6 L36 22 Z M52 38 L34 54 L28 54 L36 38 Z" />
        <rect x="30" y="20" width="62" height="20" rx="3" />
        <path d="M92 20 L106 22 L114 30 L106 38 L92 40 Z" fill="#7d8799" />
        <path d="M99 21 L104 21.7 L104 38.3 L99 39 Z" fill="#1b2a44" />
        <rect x="16" y="8" width="36" height="10" rx="5" fill="#3f6fd8" />
        <rect x="16" y="42" width="36" height="10" rx="5" fill="#3f6fd8" />
        <rect x="46" y="27" width="34" height="6" rx="1" fill="#3f6fd8" />
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

export function LoaderShip({ ship }: { ship: ShipClass }) {
  const look = LOOKS[ship];
  return (
    <svg viewBox="-60 0 180 60" width="300" height="100" aria-hidden="true">
      <defs>
        <linearGradient id="loader-hull" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={look.hull[0]} />
          <stop offset="1" stopColor={look.hull[1]} />
        </linearGradient>
        <linearGradient id="loader-trail" x1="1" y1="0" x2="0" y2="0">
          <stop offset="0" stopColor="#bfe2ff" stopOpacity="0.95" />
          <stop offset="0.25" stopColor="#5aa8ff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#3a6cff" stopOpacity="0" />
        </linearGradient>
        <radialGradient id="loader-glow">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#9fd2ff" />
          <stop offset="1" stopColor="#3a8cff" stopOpacity="0" />
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
