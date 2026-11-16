/**
 * Frame-time governor (ARCHITECTURE.md 3.5). Pure logic, fed one frame interval at a time.
 *
 * - Over 20 ms for 2 s: one rung down (pixels, then particles, then glow).
 * - Over 33 ms for 2 s with no rung left: static (the loop stops, the poster stays).
 * - Under 12 ms for 5 s on medium: up to high, once per visit.
 *
 * It measures the interval between frames, so on a 60 Hz display it can only see headroom
 * below 12 ms when the display refreshes faster than 83 Hz. That keeps `high` for machines
 * that clearly have room.
 */

import { LAST_RUNG, type Quality, RUNG_HIGH, RUNG_MEDIUM } from "./tiers";

const SLOW_MS = 20;
const VERY_SLOW_MS = 33;
const FAST_MS = 12;
const DOWN_AFTER_MS = 2000;
const UP_AFTER_MS = 5000;
const GRACE_MS = 1500; // after a start or a change: shader compiles and rebuilds are not the steady state
const HITCH_MS = 250; // one longer gap is a tab switch or a rebuild, not frame cost; a run of them is a slow device

const UP_KEY = "cosmic-archive:quality-up";

export class Governor {
  private average = 16.7;
  private slowSince: number | null = null;
  private verySlowSince: number | null = null;
  private fastSince: number | null = null;
  private graceUntil = 0;
  private hitched = false;
  private steppedUp: boolean;

  constructor(
    private rung: number,
    private readonly onChange: (quality: Quality) => void,
  ) {
    let up = false;
    try {
      up = sessionStorage.getItem(UP_KEY) === "1";
    } catch {}
    this.steppedUp = up;
  }

  /** Call when the loop (re)starts or the rung changes from outside. */
  restart(rung: number, now: number): void {
    this.rung = rung;
    this.average = 16.7;
    this.slowSince = this.verySlowSince = this.fastSince = null;
    this.hitched = false;
    this.graceUntil = now + GRACE_MS;
  }

  sample(intervalMs: number, now: number): void {
    if (intervalMs > HITCH_MS) {
      if (!this.hitched) {
        this.hitched = true;
        this.slowSince = this.verySlowSince = this.fastSince = null;
        return;
      }
      intervalMs = HITCH_MS; // every frame is this slow: count it, without letting one sample swamp the average
    } else {
      this.hitched = false;
    }
    this.average += (intervalMs - this.average) * 0.1;
    if (now < this.graceUntil) return;

    if (this.rung === LAST_RUNG && this.average > VERY_SLOW_MS) {
      this.verySlowSince ??= now;
      if (now - this.verySlowSince >= DOWN_AFTER_MS) return this.change("static", now);
    } else {
      this.verySlowSince = null;
    }

    if (this.rung < LAST_RUNG && this.average > SLOW_MS) {
      this.slowSince ??= now;
      if (now - this.slowSince >= DOWN_AFTER_MS) return this.change(this.rung + 1, now);
    } else {
      this.slowSince = null;
    }

    if (this.rung === RUNG_MEDIUM && !this.steppedUp && this.average < FAST_MS) {
      this.fastSince ??= now;
      if (now - this.fastSince >= UP_AFTER_MS) {
        this.steppedUp = true;
        try {
          sessionStorage.setItem(UP_KEY, "1");
        } catch {}
        return this.change(RUNG_HIGH, now);
      }
    } else {
      this.fastSince = null;
    }
  }

  private change(quality: Quality, now: number): void {
    if (quality !== "static") this.restart(quality, now);
    this.onChange(quality);
  }
}
