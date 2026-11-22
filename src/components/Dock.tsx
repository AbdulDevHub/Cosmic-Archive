import { AtomIcon, BookIcon, PlanetIcon, SparkIcon } from "./icons";
import styles from "./Dock.module.css";

/*
  The menu (D-116): the start page's flared glass dock, moved up into the header and flipped, so
  it hangs from the top of the window, wide where it meets the edge. Science, Explore, Learn and
  Discover are pages still to come: shown, marked "coming soon", doing nothing yet (the owner's
  call). On a phone it folds away with the rest of the header's middle.
*/

/** The outline, in its own 540 by 98 box, wide at the top (the CSS clips the blur to the same path). */
const DOCK_PATH = "M78 97H462C488 97 498 91 508 78L530 34C543 10 532 1 508 1H32C8 1 -3 10 10 34L32 78C42 91 52 97 78 97Z";

const ITEMS = [
  { label: "Science", icon: <AtomIcon /> },
  { label: "Explore", icon: <PlanetIcon /> },
  { label: "Learn", icon: <BookIcon /> },
  { label: "Discover", icon: <SparkIcon /> },
];

export function Dock() {
  return (
    <nav className={styles.dock} aria-label="Sections (coming soon)" data-menu>
      <svg className={styles.ink} aria-hidden="true" focusable="false">
        <linearGradient id="dock-ink" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21">
          <stop offset="0" stopColor="#9cc4ff" />
          <stop offset="0.55" stopColor="#b59bff" />
          <stop offset="1" stopColor="#d58cff" />
        </linearGradient>
      </svg>
      <svg className={styles.shape} viewBox="0 0 540 98" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id="dock-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c1a3a" stopOpacity="0.62" />
            <stop offset="1" stopColor="#4a4372" stopOpacity="0.5" />
          </linearGradient>
          <linearGradient id="dock-edge" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#b9b2ff" stopOpacity="0.45" />
            <stop offset="0.5" stopColor="#e4e0ff" stopOpacity="0.55" />
            <stop offset="1" stopColor="#9fb8ff" stopOpacity="0.45" />
          </linearGradient>
        </defs>
        <path d={DOCK_PATH} fill="url(#dock-fill)" stroke="url(#dock-edge)" strokeWidth="1.2" />
      </svg>
      {ITEMS.map((item) => (
        <button key={item.label} type="button" className={styles.item} aria-disabled="true" title={`${item.label}: coming soon`}>
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </nav>
  );
}
