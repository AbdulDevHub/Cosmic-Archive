"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, type KeyboardEvent, type MouseEvent } from "react";
import type { MenuFlight, MenuGroup, MenuPlace } from "@/lib/content/menu";
import { setMusicMode, toggleSound, useSound } from "@/lib/sound";
import { flowBusy, jumpTo } from "@/scene/host/flow";
import { Dock } from "./Dock";
import { Emblem, MusicIcon, SearchIcon } from "./icons";
import styles from "./SiteHeader.module.css";

/*
  The header (D-107, D-116, D-139): the emblem and the spaced wordmark on the left (it leads home,
  to the start page); in the middle the menu, the flared glass dock; search and Sound on the right.
  Search finds a place by name and flies there. Typed in full, "Music" shows a switch beside the
  field that turns the owner's music on or off (hidden Music mode, D-139).
  On a phone the menu and search fold away; the wordmark and Sound stay.
*/

/** Asks the atlas to fly back out to its start page, when Home is pressed on `/` itself. */
export const HOME_EVENT = "cosmic:home";

/** A place's name without "A", "An", "The" or "Its" in front, for matching. */
const bare = (name: string) => name.toLowerCase().replace(/^(a|an|the|its)\s+/, "");

export function SiteHeader({ groups, flights }: { groups: MenuGroup[]; flights: MenuFlight[] }) {
  const pathname = usePathname();
  const router = useRouter();
  const on = useSound((s) => s.enabled);
  const musicOn = useSound((s) => s.music);
  const [query, setQuery] = useState("");
  const places = useMemo(() => groups.flatMap((group) => group.places), [groups]);

  const asked = query.trim().toLowerCase();
  const musicWord = asked === "music";
  const matches = asked && !musicWord ? places.filter((place) => bare(place.name).includes(asked) || place.name.toLowerCase().includes(asked)).slice(0, 6) : [];

  const home = (event: MouseEvent) => {
    if (pathname !== "/" || event.metaKey || event.ctrlKey || event.shiftKey) return;
    event.preventDefault();
    window.dispatchEvent(new Event(HOME_EVENT));
  };
  const go = (place: MenuPlace) => {
    if (flowBusy()) return; // a flight is under way: the query stays for another try
    setQuery("");
    (document.activeElement as HTMLElement | null)?.blur();
    jumpTo((href) => router.push(href), `/${place.id}`, place.veil);
  };
  const onKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") setQuery("");
    if (event.key === "Enter" && matches[0]) {
      event.preventDefault();
      go(matches[0]);
    }
  };

  return (
    <header className={styles.top} data-menu>
      <Link className={styles.wordmark} href="/" onClick={home}>
        <Emblem size={56} />
        <span className={styles.letters}>
          <span>Cosmic</span> <span>Atlas</span>
        </span>
      </Link>

      <div className={styles.bar}>
        <Dock groups={groups} flights={flights} />
      </div>

      <div className={styles.tools}>
        <div className={styles.finder}>
          <label className={styles.search}>
            <SearchIcon />
            <input
              type="search"
              placeholder="Search the cosmos..."
              aria-label="Search for a place"
              autoComplete="off"
              spellCheck={false}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={onKey}
            />
          </label>
          {matches.length ? (
            <ul className={styles.results} aria-label="Places found">
              {matches.map((place) => (
                <li key={place.id}>
                <a
                  data-travel
                  className={styles.result}
                  href={`/${place.id}`}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.shiftKey) return;
                    event.preventDefault();
                    go(place);
                  }}
                >
                  {place.name}
                </a>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        {musicWord ? (
          <button type="button" className={styles.sound} onClick={() => setMusicMode(!musicOn)} data-on={musicOn ? "" : undefined} aria-pressed={musicOn} aria-label="Music" title={musicOn ? "Music on" : "Music off"}>
            <MusicIcon />
          </button>
        ) : null}
        <button type="button" className={styles.sound} onClick={toggleSound} data-sound-toggle data-on={on ? "" : undefined} aria-pressed={on} aria-label="Sound" title={on ? "Sound on" : "Sound off"}>
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor" />
            {on ? (
              <>
                <path d="M15.5 9a4.2 4.2 0 0 1 0 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                <path d="M18 6.5a7.8 7.8 0 0 1 0 11" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </>
            ) : (
              <path d="M15.5 9.5l5 5m0-5l-5 5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            )}
          </svg>
        </button>
      </div>
    </header>
  );
}
