"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, type CSSProperties } from "react";
import { endFlight, flightPathChanged, nextStep, setFlightPush, useFlight } from "@/lib/flight";
import { useFlow } from "@/scene/host/flow";
import screen from "./screen.module.css";
import styles from "./FlightBar.module.css";

/*
  A flight under way (D-151): which flight, how far along, and the way on or out. It stands above
  Zoom Out on the right, clear of the place's name and line, and over the veil, so Skip can be
  pressed at any moment, mid-move too. A guided flight has Next (named for the place it goes to)
  and End Flight; the tour flies itself and has only Skip Tour, with a line that fills until it flies on.
  Mounted once in the root layout; it shows nothing when no flight is on.
*/

export function FlightBar() {
  const flight = useFlight((s) => s.flight);
  const index = useFlight((s) => s.index);
  const moving = useFlight((s) => s.moving);
  const wait = useFlight((s) => s.wait);
  const busy = useFlow((s) => s.phase !== "idle");
  const pathname = usePathname();
  const router = useRouter();
  const first = useRef<HTMLButtonElement>(null);

  useEffect(() => setFlightPush((href) => router.push(href)), [router]);
  useEffect(() => flightPathChanged(pathname), [pathname]);
  // a flight begun from the dock takes the keyboard's focus, so Next or Skip is one key away
  useEffect(() => {
    if (flight) first.current?.focus({ preventScroll: true });
  }, [flight]);

  if (!flight) return null;
  const tour = flight.kind === "tour";
  const next = flight.steps[index + 1];
  const waiting = moving || busy;

  return (
    <aside className={styles.bar} aria-label={tour ? "Tour" : "Flight"}>
      <p className={styles.where} aria-live="polite">
        <span className={styles.name}>{flight.name}</span>
        <span>
          {index + 1} of {flight.steps.length}
        </span>
      </p>
      {/* the tour's countdown: a line that fills until it flies on (a fresh line for each wait) */}
      {tour && next && wait ? (
        <p className={styles.countdown}>
          <span>Next: {next.name}</span>
          <i key={wait.id} className={styles.timer} style={{ "--wait": `${wait.ms}ms` } as CSSProperties} aria-hidden="true" />
        </p>
      ) : null}
      <div className={styles.buttons}>
        {!tour && next ? (
          <button ref={first} type="button" className={screen.control} aria-disabled={waiting ? "true" : undefined} onClick={() => nextStep()}>
            <span>Next: {next.name}</span>
          </button>
        ) : null}
        <button ref={tour || !next ? first : undefined} type="button" className={screen.control} onClick={() => endFlight()}>
          <span>{tour ? "Skip Tour" : "End Flight"}</span>
        </button>
      </div>
    </aside>
  );
}
