/*
  Small line icons for the header and the start page (D-107), drawn here: 24-unit boxes, the
  current colour, no fill unless noted. Decorative: every one sits beside a word, so each is
  aria-hidden.
*/

import type { ReactNode } from "react";

function Icon({ children, size = 18 }: { children: ReactNode; size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export const HomeIcon = () => (
  <Icon>
    <path d="M4 11l8-6.5 8 6.5" />
    <path d="M6 9.5V19h4.5v-5h3v5H18V9.5" />
  </Icon>
);

export const OrbitIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="3.2" />
    <ellipse cx="12" cy="12" rx="9.5" ry="4" transform="rotate(-25 12 12)" />
    <circle cx="20" cy="7.5" r="0.9" fill="currentColor" />
  </Icon>
);

export const AtlasIcon = () => (
  <Icon>
    <circle cx="5" cy="7" r="1.6" />
    <circle cx="12" cy="12" r="1.6" />
    <circle cx="19" cy="6" r="1.6" />
    <circle cx="7" cy="18" r="1.6" />
    <circle cx="18" cy="18" r="1.6" />
    <path d="M6.3 8.2l4.4 2.8M13.4 11l4.3-3.8M10.8 13.2l-2.6 3.6M13.3 13.1l3.4 3.7" />
  </Icon>
);

export const MapIcon = () => (
  <Icon>
    <path d="M3.5 6.5l5-2 7 2.5 5-2v13l-5 2-7-2.5-5 2z" />
    <path d="M8.5 4.5v13M15.5 7v13" />
  </Icon>
);

export const ArchiveIcon = () => (
  <Icon>
    <ellipse cx="12" cy="6" rx="7" ry="2.6" />
    <path d="M5 6v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6V6" />
    <path d="M5 12v6c0 1.4 3.1 2.6 7 2.6s7-1.2 7-2.6v-6" />
  </Icon>
);

export const ChevronIcon = () => (
  <Icon size={14}>
    <path d="M6 9l6 6 6-6" />
  </Icon>
);

export const SearchIcon = () => (
  <Icon>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Icon>
);

export const AtomIcon = () => (
  <Icon size={26}>
    <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9.5" ry="3.8" transform="rotate(120 12 12)" />
  </Icon>
);

export const PlanetIcon = () => (
  <Icon size={26}>
    <circle cx="12" cy="12" r="5.5" />
    <path d="M3 15.5c-1.6 1.6.2 2.6 4 1.6 3.2-.8 7.3-2.8 10.6-5.3 3.2-2.5 4.4-4.6 2.4-4.8" />
  </Icon>
);

export const BookIcon = () => (
  <Icon size={26}>
    <path d="M4 5.5c2.8-1 5.5-.8 8 1 2.5-1.8 5.2-2 8-1V19c-2.8-1-5.5-.8-8 1-2.5-1.8-5.2-2-8-1z" />
    <path d="M12 6.5V20M12 9v.5" />
  </Icon>
);

export const SparkIcon = () => (
  <Icon size={26}>
    <path d="M12 2.5l1.8 7.7 7.7 1.8-7.7 1.8L12 21.5l-1.8-7.7L2.5 12l7.7-1.8z" />
  </Icon>
);

/** Zoom Out (D-116): a lens with a minus, and two corners opening outward. */
/** A pair of notes (D-139: the hidden Music switch in search). */
export const MusicIcon = () => (
  <Icon>
    <path d="M9 18V6l10-2v12" />
    <circle cx="6.5" cy="18" r="2.5" />
    <circle cx="16.5" cy="16" r="2.5" />
  </Icon>
);

export const ZoomOutIcon = () => (
  <Icon size={20}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M7.8 10.5h5.4M15 15l5 5" />
  </Icon>
);

/** D-206: a place in the Places menu not reachable yet. */
export const LockIcon = () => (
  <Icon size={14}>
    <rect x="5" y="10.5" width="14" height="10" rx="2.5" />
    <path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" />
  </Icon>
);

/** D-206: a place that can be found: a small beacon, a ring round a light. */
export const HintIcon = () => (
  <Icon size={14}>
    <circle cx="12" cy="12" r="6.5" />
    <circle cx="12" cy="12" r="2.2" fill="currentColor" stroke="none" />
  </Icon>
);

export const ArrowIcon = () => (
  <Icon size={20}>
    <path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5" />
  </Icon>
);

/**
 * The wordmark's emblem (D-203): a stellar astrolabe of our own. A burst of long and short rays
 * around a glowing violet star, held in two crossing orbits with a small moon on one, in the
 * start page's violet and blue. The browser tab's icon (src/app/icon.svg) is the same mark on a tile.
 */
export const EMBLEM_RAYS = "M32 1.5L34.4 23.5L32 26.5L29.6 23.5ZM39.46 13.98L36.64 24.72L34.1 26.92L33.87 23.57ZM50.03 13.97L39.42 27.4L35.89 28.11L36.6 24.58ZM50.02 24.54L40.43 30.13L37.08 29.9L39.28 27.36ZM62.5 32L40.5 34.4L37.5 32L40.5 29.6ZM50.02 39.46L39.28 36.64L37.08 34.1L40.43 33.87ZM50.03 50.03L36.6 39.42L35.89 35.89L39.42 36.6ZM39.46 50.02L33.87 40.43L34.1 37.08L36.64 39.28ZM32 62.5L29.6 40.5L32 37.5L34.4 40.5ZM24.54 50.02L27.36 39.28L29.9 37.08L30.13 40.43ZM13.97 50.03L24.58 36.6L28.11 35.89L27.4 39.42ZM13.98 39.46L23.57 33.87L26.92 34.1L24.72 36.64ZM1.5 32L23.5 29.6L26.5 32L23.5 34.4ZM13.98 24.54L24.72 27.36L26.92 29.9L23.57 30.13ZM13.97 13.97L27.4 24.58L28.11 28.11L24.58 27.4ZM24.54 13.98L30.13 23.57L29.9 26.92L27.36 24.72Z";

export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true" overflow="visible">
      <defs>
        <radialGradient id="emblem-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#d58bff" stopOpacity="0.75" />
          <stop offset="0.45" stopColor="#8f6bff" stopOpacity="0.28" />
          <stop offset="1" stopColor="#5b4bff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emblem-ray" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#bfe0ff" />
          <stop offset="0.5" stopColor="#c9b8ff" />
          <stop offset="1" stopColor="#e7a6ff" />
        </linearGradient>
        <linearGradient id="emblem-orbit" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#8ec5ff" />
          <stop offset="0.5" stopColor="#efeaff" />
          <stop offset="1" stopColor="#d08cff" />
        </linearGradient>
        <radialGradient id="emblem-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="0.35" stopColor="#ffd3ff" />
          <stop offset="0.7" stopColor="#d36bff" />
          <stop offset="1" stopColor="#8a4dff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <circle cx="32" cy="32" r="24" fill="url(#emblem-glow)" />
      <path d={EMBLEM_RAYS} fill="url(#emblem-ray)" opacity="0.92" />
      <g fill="none" stroke="url(#emblem-orbit)" strokeWidth="1.5">
        <ellipse cx="32" cy="32" rx="20" ry="7.5" transform="rotate(-30 32 32)" />
        <ellipse cx="32" cy="32" rx="20" ry="7.5" transform="rotate(34 32 32)" opacity="0.8" />
      </g>
      <circle cx="32" cy="32" r="9" fill="url(#emblem-core)" />
      <circle cx="32" cy="32" r="3.2" fill="#ffffff" />
      <circle cx="49.2" cy="22" r="2" fill="#efeaff" />
    </svg>
  );
}
