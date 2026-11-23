import styles from "./screen.module.css";

/*
  The video button (D-141): a small round button right of Zoom Out that opens a video about the
  view on YouTube, mostly Kurzgesagt (they inspired the site), in a new tab. Nothing is embedded:
  no third-party player or request until the visitor asks. No video, no button.
*/

export function VideoButton({ video, name }: { video?: string; name: string }) {
  if (!video) return null;
  return (
    <a className={styles.video} href={`https://www.youtube.com/watch?v=${video}`} target="_blank" rel="noopener noreferrer" aria-label={`Watch a video about ${name} (opens YouTube in a new tab)`} title="Watch a video about it">
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path d="M9 7.2v9.6L17 12z" fill="currentColor" />
      </svg>
    </a>
  );
}
