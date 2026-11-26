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
 * The owner's music is theirs alone (D-139, D-183, D-185). By default the scenes play a soft noise
 * made here in the browser (filtered, like the hush of deep space) under the same effects. The loops
 * live in the private `Private-Assets` submodule and `/api/music/` serves them only to a browser
 * whose cookie holds the owner's key. The owner keeps the key in this browser's localStorage under
 * `Music` or `MUSIC_KEY`; where it is, the music is simply on (the key is copied to the cookie on load). Without
 * it, or with a wrong one, or if a loop will not load, the noise bed plays.
 *
 * Client only. Imports nothing.
 */

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "cosmic-archive:sound";
/** Where the owner keeps their music key in this browser (D-185): either name works (D-187). */
const OWNER_KEYS = ["Music", "MUSIC_KEY"];
/** The noise bed's level inside the music's gain: softer than the music. */
const NOISE_LEVEL = 0.55;
const MUSIC_VOLUME = 0.32;

/**
 * Each scene's music (D-116, D-183): the owner's "Magical Space" for the start page and the galaxy,
 * and a loop of its own for every other atlas stop and every place, cut from the owner's chosen
 * tracks (copyrighted, so private: `src/private-assets/cosmic-atlas/music/`, served by `/api/music/`).
 * A missing loop falls back to Magical Space.
 */
const SCENES = [
  "web", "supervoid", "universe", "multiverse",
  "black-hole", "nebula", "quasar", "neutron-star", "star", "strange-star", "dyson-sphere", "moon",
  "solar-system", "blue-world", "asteroid", "quasar-galaxy", "quasi-star", "gravastar",
  "supernova-remnant", "magnetar", "black-hole-merger", "comet", "ringed-giant", "dark-matter",
  "molecular-cloud", "red-giant", "planetary-nebula", "white-dwarf", "starbase", "warp-drive",
  "programmable-matter", "higher-dimensions", "quantum-foam", "quarks", "vacuum-decay",
  "bubble-universes", "pocket-dimensions", "omniverse", "cosmic-strings", "string-theory",
  "dyson-swarm", "ringworld", "oneill-cylinder", "matrioshka-brain", "generation-ship",
  "stellar-engine", "von-neumann-probes", "space-elevator", "star-lifter", "last-civilization", "human-cell", "dna", "carbon-atom", "carbon-nucleus", "pocket-universe", "quasi-star-black-hole", "wormhole",
] as const;
const TRACKS: Record<string, string> = {
  galaxy: "/api/music/magical-space",
  ...Object.fromEntries(SCENES.map((scene) => [scene, `/api/music/${scene}`])),
  // the owner's swap (D-188): the cosmic web plays the supervoid's loop, and the supervoid the web's
  web: "/api/music/supervoid",
  supervoid: "/api/music/web",
  // the pocket universe shares its doorway's loop (D-192, the owner's choice in D-193)
  "pocket-universe": "/api/music/pocket-dimensions",
  // the quasi-star's black hole shares the quasi-star's loop (D-196)
  "quasi-star-black-hole": "/api/music/quasi-star",
};
/** The cookie that carries the owner's music key to `/api/music/` (the same name in its route). */
const KEY_COOKIE = "cosmic-atlas-music";

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
  /** True once the music (or the noise bed) is actually playing (after the first gesture). */
  playing: boolean;
  /** The owner's music instead of the noise bed: this browser holds the key (D-185). */
  music: boolean;
}

let state: SoundState = { enabled: true, playing: false, music: false };
const listeners = new Set<() => void>();

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let music: HTMLAudioElement | null = null;
let musicGain: GainNode | null = null;
let noiseGate: GainNode | null = null;

/** The owner's effects (D-114), decoded once the audio graph exists. */
export type Sample = "journey" | "travel" | "click";
const SAMPLES: Record<Sample, { url: string; gain: number; duck: number }> = {
  journey: { url: "/audio/effects/begin-journey-warp.mp3", gain: 0.6, duck: 0.45 },
  travel: { url: "/audio/effects/scene-travel-warp.mp3", gain: 0.55, duck: 0.55 },
  click: { url: "/audio/effects/menu-click.mp3", gain: 0.35, duck: 1 },
};
const decoded: Partial<Record<Sample, Promise<AudioBuffer | null>>> = {};
/** The effects' bytes, fetched once the page has loaded (no gesture needed), so Begin as the first click still sounds. */
const fetched: Partial<Record<Sample, Promise<ArrayBuffer | null>>> = {};
const bytesOf = (name: Sample) =>
  (fetched[name] ??= fetch(SAMPLES[name].url)
    .then((response) => (response.ok ? response.arrayBuffer() : null))
    .catch(() => null));

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
    () => select({ enabled: true, playing: false, music: false }),
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
  // only Music mode loads a loop: everyone else never asks for one (it would only be refused)
  if (state.music) music.src = srcOf(track);
  // a scene's loop that is not there (a loop not yet cut) falls back to Magical Space; if that will
  // not load either (no key, a wrong key), the noise bed takes over
  music.addEventListener("error", () => {
    if (!music || !state.music || !music.getAttribute("src")) return;
    if (music.src.endsWith(srcOf("galaxy"))) {
      toNoise();
      return;
    }
    music.src = srcOf("galaxy");
    // the swap that failed had faded the music out: bring Magical Space back up
    if (state.playing && state.music)
      void music.play().then(
        () => musicGain && fade(musicGain.gain, MUSIC_VOLUME, SWAP_IN),
        () => undefined,
      );
  });
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  ctx.createMediaElementSource(music).connect(musicGain).connect(master);

  // the noise bed (D-139): a few seconds of pink noise, looped, softened by a low-pass filter,
  // through the same gain as the music, so its fades and the effects' dips work the same
  const seconds = 4;
  const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0;
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1;
    b0 = 0.99765 * b0 + white * 0.099046;
    b1 = 0.963 * b1 + white * 0.2965164;
    b2 = 0.57 * b2 + white * 1.0526913;
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  noise.loop = true;
  const soft = ctx.createBiquadFilter();
  soft.type = "lowpass";
  soft.frequency.value = 700;
  noiseGate = ctx.createGain();
  noiseGate.gain.value = state.music ? 0 : NOISE_LEVEL;
  noise.connect(soft).connect(noiseGate).connect(musicGain);
  noise.start();

  // the effects: fetched and decoded now, so they are ready by the time they are asked for
  for (const name of Object.keys(SAMPLES) as Sample[]) {
    // decodeAudioData detaches the buffer it is given: decode a copy, so the bytes stay whole
    decoded[name] = bytesOf(name)
      .then((bytes) => (bytes ? ctx!.decodeAudioData(bytes.slice(0)) : null))
      .catch(() => null);
  }

  return ctx;
}

/** The music would not load: the noise bed plays instead, at the music's level, for this visit. */
function toNoise(): void {
  if (!noiseGate || !musicGain || !state.music) return;
  music?.pause();
  noiseGate.gain.value = NOISE_LEVEL;
  if (state.playing) fade(musicGain.gain, MUSIC_VOLUME, SWAP_IN);
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
  if (!state.music) return; // the noise bed does not change with the scene
  if (!state.playing) {
    music.src = srcOf(track);
    return;
  }
  swapping = true;
  fade(musicGain.gain, 0, SWAP_OUT);
  const wanted = track;
  setTimeout(() => {
    if (track !== wanted || !music || !musicGain || !state.playing || !state.music) {
      swapping = false;
      return;
    }
    music.src = srcOf(wanted);
    void music.play().then(
      () => {
        if (noiseGate) noiseGate.gain.value = 0; // a loop plays again after a fall back to the noise bed
        fade(musicGain!.gain, MUSIC_VOLUME, SWAP_IN);
      },
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
    // the bed is set here from the mode every time, so a switch made while silent always holds;
    // music that will not play (missing, blocked) falls back to the noise bed for this visit
    let musicPlays = false;
    if (state.music && !music.getAttribute("src")) music.src = srcOf(track);
    if (state.music) musicPlays = await music.play().then(() => true, () => false);
    else music.pause();
    if (noiseGate) noiseGate.gain.value = musicPlays ? 0 : NOISE_LEVEL;
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
    // a late click sounds wrong; Begin's warp still fits its flight (about 3 s) when it comes late
    const late = name === "journey" ? 2500 : 1200;
    if (!buffer || !ctx || !master || !state.enabled || performance.now() - asked > late) return;
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
    // the owner's key (D-185): where it is kept, the music is on, and the route reads it from a cookie
    // as typed, quotes or not (`my key` and `"my key"` are the same key)
    const stored = OWNER_KEYS.map((name) => localStorage.getItem(name)).find((value) => value?.trim());
    const key = stored?.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
    if (key) {
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `${KEY_COOKIE}=${encodeURIComponent(key)}; path=/; max-age=31536000; SameSite=Strict${secure}`;
    } else {
      document.cookie = `${KEY_COOKIE}=; path=/; max-age=0`;
    }
    state = { ...state, enabled: localStorage.getItem(STORAGE_KEY) !== "off", music: !!key };
  } catch {
    // storage blocked: on by default
  }
  // the first gesture anywhere starts the music (the Sound button handles its own click)
  const onGesture = (event: Event) => {
    if (held || (event.target as Element | null)?.closest?.("[data-sound-toggle]")) return;
    void start();
  };
  // fetch the effects once the page has loaded, so the first click (often Begin) has them at hand
  const prefetch = () => {
    if (!state.enabled) return;
    const idle = window.requestIdleCallback ?? ((run: () => void) => setTimeout(run, 200));
    idle(() => (Object.keys(SAMPLES) as Sample[]).forEach((name) => void bytesOf(name)));
  };
  if (document.readyState === "complete") prefetch();
  else window.addEventListener("load", prefetch, { once: true });
  // pointerdown is permission only for a mouse; a touch gives it on pointerup and click
  for (const type of ["pointerdown", "pointerup", "click", "touchend", "keydown"]) window.addEventListener(type, onGesture, { capture: true, passive: true });
  // a click in the menus beeps (D-115): the header and the start page's dock, "coming soon" items
  // too. Moves between scenes (Begin, a place, Return) play their own sound instead.
  window.addEventListener(
    "click",
    (event) => {
      const target = (event.target as Element | null)?.closest?.("[data-menu] a, [data-menu] button, [data-menu] label, [data-menu] [role='link'], [data-menu] [aria-disabled]");
      if (target && !target.closest("[data-travel]")) playSample("click"); // a link that flies plays the warp instead (D-139)
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
