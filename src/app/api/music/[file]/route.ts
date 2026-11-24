import { createHash, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import type { NextRequest } from "next/server";

/*
  The owner's music, for the owner alone (D-183). The loops live in the private `Private-Assets`
  repo, a submodule at `private-assets/`, and are never in `public/`. This route hands a loop only
  to a browser whose cookie holds the key in `MUSIC_KEY` (set once through the hidden Music switch);
  everyone else gets 401 and the soft noise bed. `/api/music/key` answers whether the key is right.
  Range requests are answered, so the audio element can seek and loop.
*/

export const dynamic = "force-dynamic";

const DIR = join(process.cwd(), "private-assets", "cosmic-atlas", "music");
const MUSIC_COOKIE = "cosmic-atlas-music"; // the same name in src/lib/sound.ts
const FILE = /^[a-z0-9-]+\.(ogg|m4a)$/;
const TYPES = { ogg: "audio/ogg", m4a: "audio/mp4" } as const;

const digest = (value: string) => createHash("sha256").update(value).digest();

/** The key as typed: decoded (the browser stores it URL-encoded: a key may hold spaces), unquoted, trimmed. */
function plain(value: string | undefined): string {
  if (!value) return "";
  let out = value;
  try {
    out = decodeURIComponent(value);
  } catch {
    // not encoded
  }
  return out.trim().replace(/^(["'])(.*)\1$/, "$2").trim();
}

function allowed(request: NextRequest): boolean {
  const key = plain(process.env.MUSIC_KEY);
  const given = plain(request.cookies.get(MUSIC_COOKIE)?.value);
  if (!key || !given) return false;
  return timingSafeEqual(digest(key), digest(given));
}

const PRIVATE = { "Cache-Control": "private, max-age=86400", Vary: "Cookie" };

export async function GET(request: NextRequest, ctx: RouteContext<"/api/music/[file]">) {
  const { file } = await ctx.params;
  const ok = allowed(request);
  if (file === "key") return new Response(null, { status: ok ? 204 : 401, headers: { "Cache-Control": "no-store" } });
  if (!ok) return new Response(null, { status: 401, headers: { "Cache-Control": "no-store" } });
  if (!FILE.test(file)) return new Response(null, { status: 404 });

  let bytes: Buffer;
  try {
    bytes = await readFile(join(DIR, file));
  } catch {
    return new Response(null, { status: 404, headers: { "Cache-Control": "no-store" } });
  }
  const type = TYPES[file.endsWith(".ogg") ? "ogg" : "m4a"];
  const size = bytes.length;

  const range = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "");
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(end, size - 1);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    return new Response(new Uint8Array(bytes.subarray(start, end + 1)), {
      status: 206,
      headers: { ...PRIVATE, "Content-Type": type, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) },
    });
  }
  return new Response(new Uint8Array(bytes), { headers: { ...PRIVATE, "Content-Type": type, "Accept-Ranges": "bytes", "Content-Length": String(size) } });
}
