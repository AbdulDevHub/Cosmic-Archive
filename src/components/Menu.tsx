"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { noteAboutFrom } from "@/lib/about";
import type { MenuFlight, MenuGroup } from "@/lib/content/menu";
import { startFlight } from "@/lib/flight";
import { flowBusy, jumpTo } from "@/scene/host/flow";
import { getSceneInput } from "@/scene/host/store";
import { BookIcon, ChevronIcon, HomeIcon, PlanetIcon, SparkIcon } from "./icons";
import styles from "./Menu.module.css";

/*
  The menu (D-201): the flat row from start-page-mockup.png, in the header's middle. The flared dock
  that hung here (D-116) is back at the bottom of the start page, holding the ships.
  - Home: back to the start page (on `/` itself it asks the atlas to fly back out).
  - Places: every place, grouped by where it is found; a choice flies there (`jumpTo`).
  - Flights (D-151): the guided flights and the hands-off tour; a choice starts one (`startFlight`).
  - About (D-184): the About page, with Islam and Space.
  The page you are on sits in a glass pill, as Home does in the mockup. Places and Flights open a
  small glass panel under the row; Escape, a click elsewhere or a choice closes it.
  On a phone it folds away with the rest of the header's middle.
*/

/** Asks the atlas to fly back out to its start page, when Home is pressed on `/` itself. */
export const HOME_EVENT = "cosmic:home";

type Panel = "places" | "flights" | null;

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
  const go = (id: string, veil: string) => {
    if (flowBusy()) return; // a flight is under way: the panel stays open for another try
    setOpen(null);
    jumpTo((href) => router.push(href), `/${id}`, veil);
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
        <div id="menu-places" className={styles.panel}>
          {groups.map((group) => (
            <div key={group.name} className={styles.group}>
              <p className={styles.groupName} id={`menu-group-${group.name.replace(/\W+/g, "-")}`}>{group.name}</p>
              <ul aria-labelledby={`menu-group-${group.name.replace(/\W+/g, "-")}`}>
                {group.places.map((place) => (
                  <li key={place.id}>
                    <a
                      data-travel
                      className={styles.choice}
                      href={`/${place.id}`}
                      onClick={(event) => {
                        if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                        event.preventDefault();
                        go(place.id, place.veil);
                      }}
                    >
                      {place.name}
                    </a>
                  </li>
                ))}
              </ul>
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
