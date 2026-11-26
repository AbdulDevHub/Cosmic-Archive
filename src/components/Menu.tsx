"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode } from "react";
import { noteAboutFrom } from "@/lib/about";
import type { MenuFlight, MenuGroup, MenuPlace } from "@/lib/content/menu";
import { startFlight } from "@/lib/flight";
import { accessOf, setHint, useVisited, type Access } from "@/lib/progress";
import { flowBusy, jumpTo, pullOut } from "@/scene/host/flow";
import { getSceneInput } from "@/scene/host/store";
import { BookIcon, ChevronIcon, HintIcon, HomeIcon, LockIcon, PlanetIcon, SparkIcon } from "./icons";
import styles from "./Menu.module.css";

/*
  The menu (D-201): the flat row from start-page-mockup.png, in the header's middle. The flared dock
  that hung here (D-116) is back at the bottom of the start page, holding the ships.
  - Home: back to the start page (on `/` itself it asks the atlas to fly back out).
  - Places: every place, grouped by where it is found (D-206: in three states, `lib/progress`). A
    visited place is unlocked: a choice flies there (`jumpTo`). One whose parent scene is open (the
    atlas, or a visited place) is a hint: a choice flies to that parent (`followHint`) and lights
    the place's beacon there. The rest are locked: shown, but not a way in yet.
  - Flights (D-151): the guided flights and the hands-off tour; a choice starts one (`startFlight`).
  - About (D-184): the About page, with Islam and Space.
  The page you are on sits in a glass pill, as Home does in the mockup. Places and Flights open a
  small glass panel under the row; Escape, a click elsewhere or a choice closes it.
  On a phone it folds away with the rest of the header's middle.
*/

/** Asks the atlas to fly back out to its start page, when Home is pressed on `/` itself. */
export const HOME_EVENT = "cosmic:home";

/** Asks the atlas to glide to a zoom (its detail) for a hint, when the hinted place's parent is the atlas on screen (D-206). */
export const HINT_EVENT = "cosmic:hint";

/**
 * A hint (D-206): light the place's beacon, then go where it is found, as its own Zoom Out would come
 * back there (the parent opens dived into its body and pulls back to show it). If that scene is
 * already on screen, nothing moves but the atlas's glide to the beacon's stop.
 */
export function followHint(place: MenuPlace, push: (href: string) => void): void {
  if (flowBusy()) return;
  setHint(place.id);
  if (location.pathname === place.outTo) {
    if (place.outTo === "/") window.dispatchEvent(new CustomEvent(HINT_EVENT, { detail: place.outZoom }));
    return;
  }
  pullOut(push, place.outTo, place.anchor, place.outZoom, place.outVeil);
}

/** What a choice of a place does in its state: fly there, follow the hint, or nothing (locked). */
export function choosePlace(place: MenuPlace, access: Access, push: (href: string) => void): boolean {
  if (access === "locked" || flowBusy()) return false;
  if (access === "hint") followHint(place, push);
  else jumpTo(push, `/${place.id}`, place.veil);
  return true;
}

type Panel = "places" | "flights" | null;

/**
 * The Places panel as tiles (D-214, D-215): two rows. On top the two big regions, three columns
 * each; below, the three smaller ones. Each tile names how many columns its places take. A group
 * not named here joins the last row. (A rail of regions with one region's places beside it is kept
 * for when the places outgrow this: `context/prototypes/places-menu-options.html`, option C.)
 */
const ROWS: [string, number][][] = [
  [["A Spiral Galaxy", 3], ["The Cosmic Web", 3]],
  [["A Solar System", 2], ["The Starbase", 3], ["A Human Cell", 2]],
];

function rowsOf(groups: MenuGroup[]): { group: MenuGroup; columns: number }[][] {
  const named = new Set(ROWS.flat().map(([name]) => name));
  const rows = ROWS.map((row) => row.flatMap(([name, columns]) => groups.filter((group) => group.name === name).map((group) => ({ group, columns }))));
  for (const group of groups) if (!named.has(group.name)) rows[rows.length - 1].push({ group, columns: 2 });
  return rows.filter((row) => row.length > 0);
}

export function Menu({ groups, flights }: { groups: MenuGroup[]; flights: MenuFlight[] }) {
  const [open, setOpen] = useState<Panel>(null);
  const root = useRef<HTMLElement>(null);
  const toggles = useRef<Record<string, HTMLButtonElement | null>>({});
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!open) return;
    const away = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(null);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      // focus goes back to the button that opened the panel
      toggles.current[open]?.focus();
      setOpen(null);
    };
    window.addEventListener("pointerdown", away);
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("pointerdown", away);
      window.removeEventListener("keydown", key);
    };
  }, [open]);

  const toggle = (panel: Exclude<Panel, null>) => setOpen((now) => (now === panel ? null : panel));
  const found = useVisited();
  const go = (place: MenuPlace, access: Access) => {
    // a flight under way, or a locked place: the panel stays open
    if (choosePlace(place, access, (href) => router.push(href))) setOpen(null);
  };
  const fly = (flight: MenuFlight) => {
    if (flowBusy()) return;
    setOpen(null);
    startFlight(flight, (href) => router.push(href));
  };
  const home = (event: MouseEvent) => {
    setOpen(null);
    if (pathname !== "/" || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    window.dispatchEvent(new Event(HOME_EVENT));
  };
  const guided = flights.filter((flight) => flight.kind === "guided");
  const tours = flights.filter((flight) => flight.kind === "tour");

  return (
    <nav ref={root} className={styles.menu} aria-label="Menu" data-menu>
      <Link className={`${styles.item} ${styles.home}`} href="/" onClick={home} data-here={pathname === "/" ? "" : undefined} aria-current={pathname === "/" ? "page" : undefined}>
        <HomeIcon />
        <span>Home</span>
      </Link>
      <Toggle label="Places" icon={<PlanetIcon />} expanded={open === "places"} controls="menu-places" onClick={() => toggle("places")} keep={(el) => {
        toggles.current.places = el;
      }} />
      <Toggle label="Flights" icon={<SparkIcon />} expanded={open === "flights"} controls="menu-flights" onClick={() => toggle("flights")} keep={(el) => {
        toggles.current.flights = el;
      }} />
      <Link
        className={styles.item}
        href="/about"
        aria-current={pathname === "/about" ? "page" : undefined}
        onClick={() => {
          noteAboutFrom(getSceneInput().zoom); // About's Back returns to this very view (D-185)
          setOpen(null);
        }}
      >
        <BookIcon />
        <span>About</span>
      </Link>

      {open === "places" ? (
        <div id="menu-places" className={`${styles.panel} ${styles.bento}`}>
          {rowsOf(groups).map((row) => (
            <div key={row[0].group.name} className={styles.row}>
          {row.map(({ group, columns }) => (
            <div key={group.name} className={styles.group} data-tile style={{ "--columns": columns } as CSSProperties}>
              <p className={styles.groupName} id={`menu-group-${group.name.replace(/\W+/g, "-")}`}>{group.name}</p>
              <ul aria-labelledby={`menu-group-${group.name.replace(/\W+/g, "-")}`}>
                {group.places.map((place) => {
                  const access = accessOf(place.id, place.parent, found);
                  return (
                    <li key={place.id}>
                      {access === "locked" ? (
                        <span className={styles.choice} data-access="locked" title="Locked: find the place it is inside first">
                          <LockIcon />
                          <span>{place.name}</span>
                          <span className={styles.hidden}> (locked: find the place it is inside first)</span>
                        </span>
                      ) : (
                        <a
                          data-travel
                          className={styles.choice}
                          data-access={access}
                          href={access === "hint" ? place.outTo : `/${place.id}`}
                          title={access === "hint" ? "Not found yet: show me where it is" : undefined}
                          onClick={(event) => {
                            if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                            event.preventDefault();
                            go(place, access);
                          }}
                        >
                          {access === "hint" ? <HintIcon /> : null}
                          <span>{place.name}</span>
                          {access === "hint" ? <span className={styles.hidden}> (not found yet: shows where it is)</span> : null}
                        </a>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
            </div>
          ))}
        </div>
      ) : null}

      {open === "flights" ? (
        <div id="menu-flights" className={`${styles.panel} ${styles.flights}`}>
          <FlightGroup id="menu-flights-guided" name="Guided Flights" flights={guided} note={(flight) => `${flight.steps.length} places, at your pace`} fly={fly} />
          <FlightGroup id="menu-flights-tour" name="Cinematic Tour" flights={tours} note={() => "Hands-off, skip any time"} fly={fly} />
        </div>
      ) : null}
    </nav>
  );
}

function FlightGroup({ id, name, flights, note, fly }: { id: string; name: string; flights: MenuFlight[]; note: (flight: MenuFlight) => string; fly: (flight: MenuFlight) => void }) {
  if (flights.length === 0) return null;
  return (
    <div className={styles.group}>
      <p className={styles.groupName} id={id}>{name}</p>
      <ul aria-labelledby={id}>
        {flights.map((flight) => (
          <li key={flight.id}>
            <button type="button" data-travel className={styles.choice} onClick={() => fly(flight)}>
              <span>{flight.name}</span>
              <small>{note(flight)}</small>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Toggle({ label, icon, expanded, controls, onClick, keep }: { label: string; icon: ReactNode; expanded: boolean; controls: string; onClick: () => void; keep: (el: HTMLButtonElement | null) => void }) {
  return (
    <button ref={keep} type="button" className={styles.item} aria-expanded={expanded} aria-controls={controls} onClick={onClick}>
      {icon}
      <span>{label}</span>
      <i className={styles.chevron} aria-hidden="true">
        <ChevronIcon />
      </i>
    </button>
  );
}
