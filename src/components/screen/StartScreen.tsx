"use client";

import type { MouseEvent } from "react";
import { ArrowIcon, AtomIcon, BookIcon, PlanetIcon, SparkIcon } from "../icons";
import type { Topic } from "./AtlasView";
import styles from "./start.module.css";

/*
  The start page's words (D-107, D-108), from the owner's Home.png: a spaced line above the
  headline, "The Universe Awaits" with its last two words in a blue-to-violet gradient, one line
  under it, and a glowing "Begin Your Journey" button. Begin is the way in: the click that is
  allowed to start the music, and the start of the flight into the galaxy. "Scroll to explore"
  says the wheel (or a swipe) does the same.

  "Featured Topics" on the right are four more ways in: each flies to the galaxy like Begin, then
  dives into its place. They are real links, so they work without the scene too. Their pictures
  are our own scenes' posters.

  The dock at the bottom (Science, Explore, Learn, Discover) is for pages still to come: shown,
  marked "coming soon", doing nothing yet (the owner's call).
*/

export type StartPhase = "start" | "leaving" | "atlas";

const DOCK = [
  { label: "Science", icon: <AtomIcon /> },
  { label: "Explore", icon: <PlanetIcon /> },
  { label: "Learn", icon: <BookIcon /> },
  { label: "Discover", icon: <SparkIcon /> },
];

/** Each topic's picture: a poster of our own scene, and where to centre it. */
const PICTURES: Record<string, { src: string; at: string; size: string }> = {
  "black-hole": { src: "/posters/black-hole-wide.webp", at: "50% 50%", size: "cover" },
  galaxy: { src: "/posters/atlas-start-wide.webp", at: "68% 42%", size: "300%" },
  nebula: { src: "/posters/nebula-wide.webp", at: "50% 50%", size: "cover" },
  quasar: { src: "/posters/quasar-wide.webp", at: "50% 50%", size: "190%" },
};

interface Props {
  phase: StartPhase;
  onBegin: () => void;
  topics: readonly Topic[];
  onTopic: (to: string) => void;
}

export function StartScreen({ phase, onBegin, topics, onTopic }: Props) {
  if (phase === "atlas") return null;
  const open = (event: MouseEvent, to: string) => {
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    onTopic(to);
  };
  return (
    <div className={styles.start} data-leaving={phase === "leaving" ? "" : undefined}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>
          <span>Explore</span>
          <i aria-hidden="true">•</i>
          <span>Discover</span>
          <i aria-hidden="true">•</i>
          <span>Be inspired</span>
        </p>
        <h1 className={styles.title}>
          The <span className={styles.gradient}>Universe Awaits</span>
        </h1>
        <p className={styles.line}>
          A journey through space, time and higher dimensions —<br className={styles.wide} /> where every star tells a story.
        </p>
        <button type="button" className={styles.begin} onClick={onBegin}>
          <span>Begin Your Journey</span>
          <ArrowIcon />
        </button>
      </div>

      <aside className={styles.topics} aria-labelledby="featured-title">
        <div className={styles.topicsHead}>
          <h2 id="featured-title">Featured Topics</h2>
          <span className={styles.viewAll} aria-disabled="true" title="View all: coming soon">
            View all <ArrowIcon />
          </span>
        </div>
        <ul>
          {topics.map((topic) => {
            const picture = PICTURES[topic.to];
            return (
              <li key={topic.to}>
                <a className={styles.topic} href={topic.href} onClick={(event) => open(event, topic.to)}>
                  <span
                    className={styles.thumb}
                    aria-hidden="true"
                    style={picture ? { backgroundImage: `url(${picture.src})`, backgroundPosition: picture.at, backgroundSize: picture.size } : undefined}
                  />
                  <span className={styles.topicWords}>
                    <strong>{topic.name}</strong>
                    <span>{topic.line}</span>
                  </span>
                </a>
              </li>
            );
          })}
        </ul>
      </aside>

      <p className={styles.scroll} aria-hidden="true">
        <span className={styles.mouse} />
        <span>Scroll to explore</span>
      </p>

      <nav className={styles.dock} aria-label="Sections (coming soon)">
        <svg className={styles.ink} aria-hidden="true" focusable="false">
          <linearGradient id="dock-ink" gradientUnits="userSpaceOnUse" x1="3" y1="3" x2="21" y2="21">
            <stop offset="0" stopColor="#9cc4ff" />
            <stop offset="0.55" stopColor="#b59bff" />
            <stop offset="1" stopColor="#d58cff" />
          </linearGradient>
        </svg>
        {DOCK.map((item) => (
          <span key={item.label} className={styles.dockItem} aria-disabled="true" title={`${item.label}: coming soon`}>
            {item.icon}
            <span>{item.label}</span>
          </span>
        ))}
      </nav>
    </div>
  );
}
