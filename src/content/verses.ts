/**
 * The Islam and Space page (D-136 item 13, D-179): a few verses about the heavens, quoted as they
 * are, with no claim about science attached. Each is The Clear Quran (Dr. Mustafa Khattab) on
 * Quran.com, fetched on 2026-11-24. A verse that runs on is cut with an ellipsis; its link has the rest.
 */

export interface Verse {
  /** Surah and verse, as "3:190". */
  key: string;
  surah: string;
  text: string;
  url: string;
  checked: string;
}

export const VERSES_TITLE = "Islam and Space";
export const VERSES_LINE = "Verses on the heavens, for those who look up and reflect.";

export const VERSES: readonly Verse[] = [
  { key: "3:190", surah: "Al-Imran", text: "Indeed, in the creation of the heavens and the earth and the alternation of the day and night…", url: "https://quran.com/3/190", checked: "2026-11-24" },
  { key: "21:30", surah: "Al-Anbiya", text: "Do the disbelievers not realize that the heavens and earth were ˹once˺ one mass then We split them apart?", url: "https://quran.com/21/30", checked: "2026-11-24" },
  { key: "51:47", surah: "Adh-Dhariyat", text: "We built the universe with ˹great˺ might, and We are certainly expanding ˹it˺.", url: "https://quran.com/51/47", checked: "2026-11-24" },
  { key: "21:33", surah: "Al-Anbiya", text: "And He is the One Who created the day and the night, the sun and the moon…", url: "https://quran.com/21/33", checked: "2026-11-24" },
  { key: "67:3", surah: "Al-Mulk", text: "˹He is the One˺ Who created seven heavens, one above the other.", url: "https://quran.com/67/3", checked: "2026-11-24" },
];
