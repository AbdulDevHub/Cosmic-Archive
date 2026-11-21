/**
 * Sound (D-100): the owner's own music, "Magical Space", looped quietly under the scenes, and a
 * soft whoosh made in the browser for every flight (a dive, a pull-out, a glide between stops).
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
let noise: AudioBuffer | null = null;

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
  music.src = music.canPlayType('audio/ogg; codecs="vorbis"') ? "/sounds/magical-space.ogg" : "/sounds/magical-space.m4a";
  musicGain = ctx.createGain();
  musicGain.gain.value = 0;
  ctx.createMediaElementSource(music).connect(musicGain).connect(master);

  // one second of white noise, the raw material of every whoosh
  noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
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
 * A breath of air for a flight (D-103): soft noise, filtered high and wide, swelling slowly and
 * fading slowly, its colour drifting up for a dive (`in`), down for a pull-out (`out`), barely at
 * all between stops (`glide`); over it a faint shimmer of two high, detuned tones. No low end and
 * no sharp onset, so it never thumps. The music dips a little under it.
 */
export function whoosh(kind: "in" | "out" | "glide", seconds = 1.4): void {
  if (!state.enabled || !state.playing || !ctx || !master || !noise || !musicGain) return;
  const now = ctx.currentTime;
  const end = now + seconds;
  const peak = now + seconds * (kind === "out" ? 0.4 : 0.6);
  const loud = kind === "glide" ? 0.05 : 0.08;

  // the air: noise through a wide band-pass that drifts, then a gentle low cut so nothing booms
  const source = ctx.createBufferSource();
  source.buffer = noise;
  source.loop = true;
  const band = ctx.createBiquadFilter();
  band.type = "bandpass";
  band.Q.value = 0.6;
  const [from, to] = kind === "out" ? [2600, 900] : kind === "in" ? [900, 3200] : [1400, 1900];
  band.frequency.setValueAtTime(from, now);
  band.frequency.linearRampToValueAtTime(to, end);
  const lowCut = ctx.createBiquadFilter();
  lowCut.type = "highpass";
  lowCut.frequency.value = 420;
  const air = ctx.createGain();
  air.gain.setValueAtTime(0, now);
  air.gain.linearRampToValueAtTime(loud, peak);
  air.gain.linearRampToValueAtTime(0, end);
  source.connect(band).connect(lowCut).connect(air).connect(master);
  source.start(now);
  source.stop(end + 0.05);

  // the shimmer: two quiet high tones, a fifth apart and slightly detuned, gliding with the flight
  const base = kind === "out" ? 880 : 660;
  const glideTo = kind === "out" ? 660 : kind === "in" ? 880 : 700;
  for (const [ratio, detune] of [[1, -6], [1.5, 7]] as const) {
    const tone = ctx.createOscillator();
    tone.type = "sine";
    tone.detune.value = detune;
    tone.frequency.setValueAtTime(base * ratio, now);
    tone.frequency.linearRampToValueAtTime(glideTo * ratio, end);
    const level = ctx.createGain();
    level.gain.setValueAtTime(0, now);
    level.gain.linearRampToValueAtTime(loud * 0.12, peak);
    level.gain.linearRampToValueAtTime(0, end);
    tone.connect(level).connect(master);
    tone.start(now);
    tone.stop(end + 0.05);
  }

  // the music dips a little under the flight and comes back
  const g = musicGain.gain;
  g.cancelScheduledValues(now);
  g.setValueAtTime(g.value, now);
  g.linearRampToValueAtTime(MUSIC_VOLUME * 0.75, now + seconds * 0.4);
  g.linearRampToValueAtTime(MUSIC_VOLUME, end + 0.8);
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
