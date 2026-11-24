"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { noteAboutFrom } from "@/lib/about";
import type { MenuFlight, MenuGroup } from "@/lib/content/menu";
import { startFlight } from "@/lib/flight";
import { SHIPS, setShip, useShip } from "@/lib/ship";
import { flowBusy, jumpTo } from "@/scene/host/flow";
import { BookIcon, PlanetIcon, ShipIcon, SparkIcon } from "./icons";
import styles from "./Dock.module.css";

/*
  The menu (D-116, D-139): the start page's flared glass dock, hanging in the header. Its
  placeholders are gone; it holds what the site has:
  - Places: every place, grouped by where it is found; a choice flies there (`jumpTo`).
  - Flights (D-151): the guided flights (A Star's Life, Black Hole to Quasar) and the hands-off
    tour; a choice starts it (`startFlight`), and the flight bar takes over.
  - Ship: the fleet (D-118), moved here off the start page; the choice flies in the start scene.
  - About (D-184): a plain link to the About page, with Islam and Space.
  Each opens a small glass panel under the dock; Escape, a click elsewhere or a choice closes it.
  On a phone it folds away with the rest of the header's middle.
*/

/** The outline, in its own 540 by 98 box, wide at the top (the CSS clips the blur to the same path). */
const DOCK_PATH = "M78 97H462C488 97 498 91 508 78L530 34C543 10 532 1 508 1H32C8 1 -3 10 10 34L32 78C42 91 52 97 78 97Z";

type Panel = "places" | "flights" | "ship" | null;

export function Dock({ groups, flights }: { groups: MenuGroup[]; flights: MenuFlight[] }) {
  const [open, setOpen] = useState<Panel>(null);
  const root = useRef<HTMLElement>(null);
  const toggles = useRef<Record<string, HTMLButtonElement | null>>({});
  const router = useRouter();
  const chosen = useShip();

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
  const guided = flights.filter((flight) => flight.kind === "guided");
  const tours = flights.filter((flight) => flight.kind === "tour");

  return (
    <nav ref={root} className={styles.dock} aria-label="Menu" data-menu>
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

      <Item label="Places" icon={<PlanetIcon />} expanded={open === "places"} controls="dock-places" onClick={() => toggle("places")} keep={(el) => {
        toggles.current.places = el;
      }} />
      <Item label="Flights" icon={<SparkIcon />} expanded={open === "flights"} controls="dock-flights" onClick={() => toggle("flights")} keep={(el) => {
        toggles.current.flights = el;
      }} />
      <Item label="Ship" icon={<ShipIcon />} expanded={open === "ship"} controls="dock-ship" onClick={() => toggle("ship")} keep={(el) => {
        toggles.current.ship = el;
      }} />
      <Link
        className={styles.item}
        href="/about"
        onClick={() => {
          noteAboutFrom(); // About's Back returns here (D-185)
          setOpen(null);
        }}
      >
        <BookIcon />
        <span>About</span>
      </Link>

      {open === "places" ? (
        <div id="dock-places" className={styles.panel}>
          {groups.map((group) => (
            <div key={group.name} className={styles.group}>
              <p className={styles.groupName} id={`dock-group-${group.name.replace(/\W+/g, "-")}`}>{group.name}</p>
              <ul aria-labelledby={`dock-group-${group.name.replace(/\W+/g, "-")}`}>
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
        <div id="dock-flights" className={`${styles.panel} ${styles.flights}`}>
          <FlightGroup id="dock-flights-guided" name="Guided Flights" flights={guided} note={(flight) => `${flight.steps.length} places, at your pace`} fly={fly} />
          <FlightGroup id="dock-flights-tour" name="Cinematic Tour" flights={tours} note={() => "Hands-off, skip any time"} fly={fly} />
        </div>
      ) : null}

      {open === "ship" ? (
        <div id="dock-ship" className={`${styles.panel} ${styles.ships}`} role="radiogroup" aria-label="Choose your vessel">
          <p className={styles.groupName}>Choose Your Vessel</p>
          {SHIPS.map((ship) => (
            <button key={ship.id} type="button" role="radio" aria-checked={chosen === ship.id} className={styles.choice} onClick={() => setShip(ship.id)}>
              <span>{ship.name}</span>
              <small>{ship.role}</small>
            </button>
          ))}
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

function Item({ label, icon, expanded, controls, onClick, keep }: { label: string; icon: ReactNode; expanded: boolean; controls: string; onClick: () => void; keep: (el: HTMLButtonElement | null) => void }) {
  return (
    <button ref={keep} type="button" className={styles.item} aria-expanded={expanded} aria-controls={controls} onClick={onClick}>
      {icon}
      <span>{label}</span>
    </button>
  );
}
