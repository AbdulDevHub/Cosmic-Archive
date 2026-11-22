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
export const ZoomOutIcon = () => (
  <Icon size={20}>
    <circle cx="10.5" cy="10.5" r="6" />
    <path d="M7.8 10.5h5.4M15 15l5 5" />
  </Icon>
);

export const ArrowIcon = () => (
  <Icon size={20}>
    <path d="M5 12h14M13.5 6.5L19 12l-5.5 5.5" />
  </Icon>
);

/** The wordmark's emblem: a small spiral galaxy of our own, in the start page's violet and blue. */
export function Emblem({ size = 44 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} aria-hidden="true">
      <defs>
        <radialGradient id="emblem-core" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff6e6" />
          <stop offset="0.35" stopColor="#c9a8ff" />
          <stop offset="1" stopColor="#6d5bff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="emblem-arm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fb6ff" />
          <stop offset="1" stopColor="#b57bff" />
        </linearGradient>
      </defs>
      <g transform="rotate(-28 24 24)" fill="none" stroke="url(#emblem-arm)" strokeLinecap="round">
        <path d="M24 24c6-4 14-1 15 5s-6 11-14 10" strokeWidth="2.6" />
        <path d="M24 24c-6 4-14 1-15-5s6-11 14-10" strokeWidth="2.6" />
        <path d="M24 24c3-6 11-8 16-4" strokeWidth="1.2" opacity="0.7" />
        <path d="M24 24c-3 6-11 8-16 4" strokeWidth="1.2" opacity="0.7" />
      </g>
      <circle cx="24" cy="24" r="9" fill="url(#emblem-core)" />
    </svg>
  );
}
