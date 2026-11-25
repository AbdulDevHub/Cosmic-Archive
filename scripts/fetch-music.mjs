// Music on every push (D-211). Runs before `next build` (npm's `prebuild`).
//
// The owner's music lives in the private `Private-Assets` repo, a submodule at `src/private-assets/`
// (D-183, D-207). Vercel's Git builds cannot fetch a private submodule, so they would ship with only
// the noise bed. When `MUSIC_REPO_TOKEN` is set (a fine-grained GitHub token: Private-Assets only,
// Contents: read) and the submodule is empty, this fetches the commit the submodule is pinned to as a
// tarball and unpacks it in place. No dependency: Node's fetch and the system's `tar`.
//
// - Music already there (a local checkout with the submodule): nothing to do.
// - No token: the build goes on and the site plays the noise bed, as before.
// - Token set but the fetch fails: the build fails, so a deploy never quietly loses the music
//   (the last good deploy stays live).
//
// `MUSIC_DIR` moves the target folder (for testing); it defaults to `src/private-assets`.

import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { Readable } from "node:stream";

const SUBMODULE = "src/private-assets";
const target = process.env.MUSIC_DIR || SUBMODULE;
const music = join(target, "cosmic-atlas", "music");
const token = process.env.MUSIC_REPO_TOKEN;

const say = (line) => console.log(`fetch-music: ${line}`);

if (existsSync(music) && readdirSync(music).length > 0) {
  say("music already present, nothing to fetch");
  process.exit(0);
}
if (!token) {
  say("no MUSIC_REPO_TOKEN and no music: building with the noise bed only");
  process.exit(0);
}

/** The music repo, as `owner/name`, from `.gitmodules`. */
function musicRepo() {
  const url = readFileSync(".gitmodules", "utf8").match(/url\s*=\s*(\S+)/)?.[1];
  const repo = url?.match(/github\.com[/:](.+?)(?:\.git)?$/)?.[1];
  if (!repo) throw new Error("could not read the music repo from .gitmodules");
  return repo;
}

/** The commit the submodule is pinned to: from git when the checkout has it, else from GitHub's API. */
async function pinnedCommit() {
  try {
    const line = execFileSync("git", ["ls-tree", "HEAD", SUBMODULE], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
    const sha = line.match(/^160000 commit ([0-9a-f]{40})/)?.[1];
    if (sha) return sha;
  } catch {
    // no git history here (Vercel's build copy may not have it): ask GitHub
  }
  const { VERCEL_GIT_REPO_OWNER: owner, VERCEL_GIT_REPO_SLUG: slug, VERCEL_GIT_COMMIT_SHA: ref } = process.env;
  if (!owner || !slug || !ref) throw new Error("no git history and no VERCEL_GIT_* variables to find the pinned commit");
  // this site's repo is public, so no token is needed (or sent) here
  const res = await fetch(`https://api.github.com/repos/${owner}/${slug}/contents/${SUBMODULE}?ref=${ref}`, {
    headers: { Accept: "application/vnd.github+json", "User-Agent": "cosmic-atlas-build" },
  });
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for the submodule's commit`);
  const body = await res.json();
  if (body.type !== "submodule" || !body.sha) throw new Error(`${SUBMODULE} is not a submodule at ${ref}`);
  return body.sha;
}

try {
  const repo = musicRepo();
  const sha = await pinnedCommit();
  say(`fetching ${repo} at ${sha.slice(0, 7)}`);
  const res = await fetch(`https://api.github.com/repos/${repo}/tarball/${sha}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "cosmic-atlas-build" },
  });
  if (!res.ok || !res.body) throw new Error(`GitHub answered ${res.status} for the music (check the token can read ${repo})`);
  mkdirSync(target, { recursive: true });
  // the tarball's one top folder is `<owner>-<repo>-<sha>/`: strip it so the files land as in the submodule
  const tar = spawn("tar", ["-xzf", "-", "--strip-components=1", "-C", target], { stdio: ["pipe", "inherit", "inherit"] });
  Readable.fromWeb(res.body).pipe(tar.stdin);
  const code = await new Promise((resolve, reject) => {
    tar.on("error", reject);
    tar.on("close", resolve);
  });
  if (code !== 0) throw new Error(`tar exited with ${code}`);
  const count = existsSync(music) ? readdirSync(music).length : 0;
  if (count === 0) throw new Error(`the fetched repo has no ${join("cosmic-atlas", "music")} folder`);
  say(`${count} music files in place`);
} catch (error) {
  console.error(`fetch-music: ${error instanceof Error ? error.message : error}`);
  console.error("fetch-music: MUSIC_REPO_TOKEN is set but the music could not be fetched; failing so the live deploy keeps its music");
  process.exit(1);
}
