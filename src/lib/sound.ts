/**
 * Sound (D-100, D-114): the owner's own music, "Magical Space", looped quietly under the scenes;
 * three effects the owner chose: a warp jump for Begin (`journey`), a warp-out for every move
 * between scenes (`travel`: into or out of a place, out to the web and back, Return), and a short
 * beep for a click in the menus (`click`, D-115). The browser-made whooshes are gone (D-115).
 *
 * Browsers only let a page make sound after the visitor does something, so the music starts on
 * the first click, tap or key press, and fades in. On the start page it waits for Begin instead
 * (`holdMusic`, `playMusic`): the owner wants Begin to be what starts it. The header's Sound button turns it all off
 * and on; the choice is remembered. Nothing plays while the tab is hidden.
 *
 * Client only. Imports nothing.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cosmic-archive:sound";
const MUSIC_VOLUME = 0.32;

/**
 * Each scene's music (D-116): the owner's "Magical Space" for the start page and the galaxy, and a
 * loop cut from the owner's chosen tracks for the web and each place (`public/music/`, kept out of
 * git: copyrighted). A missing loop falls back to Magical Space.
 */
const TRACKS: Record<string, string> = {
  galaxy: "/sounds/magical-space",
  web: "/music/web",
  "black-hole": "/music/black-hole",
  quasar: "/music/quasar",
  nebula: "/music/nebula",
  "neutron-star": "/music/neutron-star",
  star: "/music/star",
  "strange-star": "/music/strange-star",
  "dyson-sphere": "/music/dyson-sphere",
  "wormhole": "/music/wormhole",
  "gravastar": "/music/gravastar",
  supervoid: "/music/web",
};
const SWAP_OUT = 0.9; // seconds: the old track fades out, then the new one fades in
const SWAP_IN = 2.2;
let track = "galaxy";
/** True while one track fades out and the next fades in: the effects do not duck the music then. */
let swapping = false;
let canOgg = true;
const srcOf = (name: string) => (TRACKS[name] ?? TRACKS.galaxy) + (canOgg ? ".ogg" : ".m4a");
const FADE_IN = 2.5; // seconds
const FADE_OUT = 0.6;

interface SoundState {
  /** The visitor's choice. */
  enabled: boolean;
  /** True once the music is actually playing (after the first gesture). */
  playing: boolean;
}

let state: SoundState = { enabled: true, playing: false };
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let music: HTMLAudioElement | null = null;
let musicGain: GainNode | null = null;

/** The owner's effects (D-114), decoded once the audio graph exists. */
export type Sample = "journey" | "travel" | "click";
const SAMPLES: Record<Sample, { url: string; gain: number; duck: number }> = {
  journey: { url: "/sounds/tng_warp6_clean.mp3", gain: 0.6, duck: 0.45 },
  travel: { url: "/sounds/tng_warp_out1.mp3", gain: 0.55, duck: 0.55 },
  click: { url: "/sounds/padd_3.mp3", gain: 0.35, duck: 1 },
};
const decoded: Partial<Record<Sample, Promise<AudioBuffer | null>>> = {};

function set(patch: Partial<SoundState>): void {
  state = { ...state, ...patch };
  listeners.forEach((listener) => listener());
}

export function useSound<T>(select: (s: SoundState) => T): T {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => select(state),
    () => select({ enabled: true, playing: false }),
  );
}

/** Builds the audio graph once, inside a gesture. */
function graph(): AudioContext | null {
  if (ctx) return ctx;
  const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  ctx = new AC();
  master = ctx.createGain();
  master.connect(ctx.destination);

  music = new Audio();
  music.loop = true;
  music.preload = "auto";
  // Vorbis where the browser plays it, AAC elsewhere (Safari)
  canOgg = music.canPlayType('audio/ogg; codecs="vorbis"') !== "";
  music.src = srcOf(track);
  // a scene's loop that is not there (a fresh clone: the loops are not in git) falls back to Magical Space
  music.addEventListener("error", () => {
    if (!music || music.src.endsWith(srcOf("galaxy"))) return;
    music.src = srcOf("galaxy");
    // the swap that failed had faded the music out: bring Magical Space back up
    if (state.playing)
      void music.play().then(
        () => musicGain && fade(musicGain.gain, MUSIC_VOLUME, SWAP_IN),
        () => undefined,
      );
  });
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  ctx.createMediaElementSource(music).connect(musicGain).connect(master);

  // the effects: fetched and decoded now, so they are ready by the time they are asked for
  for (const name of Object.keys(SAMPLES) as Sample[]) {
    decoded[name] = fetch(SAMPLES[name].url)
      .then((response) => response.arrayBuffer())
      .then((bytes) => ctx!.decodeAudioData(bytes))
      .catch(() => null);
  }

  return ctx;
}

function fade(gain: AudioParam, to: number, seconds: number): void {
  if (!ctx) return;
  const now = ctx.currentTime;
  gain.cancelScheduledValues(now);
  gain.setValueAtTime(gain.value, now);
  gain.linearRampToValueAtTime(to, now + seconds);
}

let starting = false;
/** True while the start page is up: a gesture there does not start the music, only Begin does. */
let held = false;

export function holdMusic(on: boolean): void {
  held = on;
}

/**
 * The scene on screen asks for its music (D-116). Before the music has started this only chooses
 * what will play; while it plays, the old track fades out and the new one fades in.
 */
export function setMusic(name: string): void {
  if (!(name in TRACKS) || name === track) return;
  track = name;
  if (!music || !musicGain || !ctx) return;
  if (!state.playing) {
    music.src = srcOf(track);
    return;
  }
  swapping = true;
  fade(musicGain.gain, 0, SWAP_OUT);
  const wanted = track;
  setTimeout(() => {
    if (track !== wanted || !music || !musicGain || !state.playing) {
      swapping = false;
      return;
    }
    music.src = srcOf(wanted);
    void music.play().then(
      () => fade(musicGain!.gain, MUSIC_VOLUME, SWAP_IN),
      () => undefined,
    );
    setTimeout(() => (swapping = false), SWAP_IN * 1000);
  }, SWAP_OUT * 1000 + 50);
}

/** Begin: lets the music start, and starts it (its click is the gesture that allows sound). */
export function playMusic(): void {
  held = false;
  void start();
}

/**
 * Starts the music, inside a gesture. Playing is only marked once the context is really running:
 * a blocked start (a touch's pointerdown is not yet permission) leaves it ready to try again on
 * the next gesture.
 */
async function start(): Promise<void> {
  if (!state.enabled || state.playing || starting || document.hidden) return;
  const audio = graph();
  const gain = musicGain;
  if (!audio || !music || !gain) return;
  starting = true;
  try {
    await audio.resume();
    await music.play();
    if (audio.state !== "running" || !state.enabled) {
      music.pause();
      return;
    }
    fade(gain.gain, MUSIC_VOLUME, FADE_IN);
    set({ playing: true });
  } catch {
    // blocked, or failed to load: silent for now, and the next gesture tries again
  } finally {
    starting = false;
  }
}

function stop(): void {
  if (!music || !musicGain) return;
  fade(musicGain.gain, 0, FADE_OUT);
  const audio = music;
  setTimeout(() => {
    if (!state.playing || !state.enabled || document.hidden) audio.pause();
  }, FADE_OUT * 1000 + 50);
  set({ playing: false });
}

/** The Sound button: on and off, remembered. Its click is a gesture, so turning on starts at once. */
export function toggleSound(): void {
  const enabled = !state.enabled;
  set({ enabled });
  try {
    localStorage.setItem(STORAGE_KEY, enabled ? "on" : "off");
  } catch {
    // storage blocked: the choice holds for this page view
  }
  if (enabled) void start();
  else stop();
}

/**
 * One of the owner's effects (D-114). Called from a gesture, it may build the audio graph itself,
 * so a click can sound before the music has started (the music still waits for Begin). If the
 * effect is still loading it plays when ready, unless that is more than a moment late. The music
 * dips under the longer ones.
 */
export function playSample(name: Sample): void {
  if (!state.enabled || document.hidden) return;
  const audio = graph();
  if (!audio || !master) return;
  if (audio.state === "suspended") void audio.resume();
  const asked = performance.now();
  void decoded[name]?.then((buffer) => {
    if (!buffer || !ctx || !master || !state.enabled || performance.now() - asked > 1200) return;
    const { gain, duck } = SAMPLES[name];
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const level = ctx.createGain();
    level.gain.value = gain;
    source.connect(level).connect(master);
    source.start();
    // no duck during a change of track: its own fades already carry the music (and would be cancelled)
    if (duck < 1 && musicGain && state.playing && !swapping) {
      const now = ctx.currentTime;
      const g = musicGain.gain;
      g.cancelScheduledValues(now);
      g.setValueAtTime(g.value, now);
      g.linearRampToValueAtTime(MUSIC_VOLUME * duck, now + 0.4);
      g.setValueAtTime(MUSIC_VOLUME * duck, now + buffer.duration * 0.7);
      g.linearRampToValueAtTime(MUSIC_VOLUME, now + buffer.duration + 1.2);
    }
  });
}


if (typeof window !== "undefined") {
  try {
    state = { ...state, enabled: localStorage.getItem(STORAGE_KEY) !== "off" };
  } catch {
    // storage blocked: on by default
  }
  // the first gesture anywhere starts the music (the Sound button handles its own click)
  const onGesture = (event: Event) => {
    if (held || (event.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
    void start();
  };
  // pointerdown is permission only for a mouse; a touch gives it on pointerup and click
  for (const type of ["pointerdown", "pointerup", "click", "touchend", "keydown"]) window.addEventListener(type, onGesture, { capture: true, passive: true });
  // a click in the menus beeps (D-115): the header and the start page's dock, "coming soon" items
  // too. Moves between scenes (Begin, a place, Return) play their own sound instead.
  window.addEventListener(
    "click",
    (event) => {
      const target = (event.target as Element | null)?.closest?.("[data-menu] a, [data-menu] button, [data-menu] label, [data-menu] [role='link'], [data-menu] [aria-disabled]");
      if (target) playSample("click");
    },
    { capture: true, passive: true },
  );
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      music?.pause();
      void ctx?.suspend();
      set({ playing: false });
    } else if (state.enabled && ctx && !held) {
      void start();
    }
  });
}
