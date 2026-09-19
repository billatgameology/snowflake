# Plan — Nivogenesis public release (completed work only, clean URLs)

- **Phase:** Maker-directed Journey/media release; no scientific phase, solver or gate change
- **Status:** complete — live at https://nivogenesis.web.app since 2026-09-18; currently from website `8ef55a9` (tag `nivogenesis-public-2026-09-19`, the series home redesign), before that `84af23f` (tag `nivogenesis-public-2026-09-18.2`) and first `30d05f6` (tag `nivogenesis-public-2026-09-18`); see the completion record at the end
- **Started:** 2026-09-18
- **Last touched:** 2026-09-18 by Claude Fable 5.1 (second-pass review, maker decisions D10–D21, execution)
- **Related:** [science series plan](explore-journey-science-series.md), [bilingual plan](science-series-bilingual.md) (the Yun-voice amendment in flight), [next-session file map](../video/nivogenesis-next-session-prompt.md)

## Goal

Publish Nivogenesis to the public web with exactly the completed work: the opening (home) and
Episode 1, in English and Mandarin, at clean root URLs. Every experiment, the earlier
`/film/part-1` film, draft narration revisions, unreleased Episode 2 material and export output
stay local-only — present in the repository and the local dev server, absent from the public
deployment. Nothing is deleted. Once this lands, a release is one reproducible command from a
committed state, and releasing more work later (for example Episode 2) is an explicit allowlist
change, not an accident of what sits in `public/`.

## Maker decisions recorded 2026-09-18 (do not relitigate)

| # | Decision |
|---|---|
| D1 | **Public = completed work only.** Experiments stay local. |
| D2 | **Clean URLs (option B).** The series home is served at `/`; Episode 1 at `/episode-1`. A `/` → `/series` redirect (option A) was offered and rejected. |
| D3 | **No language URLs.** EN / 中文 stays one seamless in-page toggle; no `/zh` paths and no browser-language auto-switch. |
| D4 | **Name and link preview use the current identity, Nivogenesis** — not "Cryosphere". |
| D5 | **Voice rights:** the maker holds commercial rights for the synthesized narration. |
| D6 | **Independent science review of Episode 1 before the live deploy** (Rule 13); a preview may precede it. |
| D7 | **No analytics** in this release, so no privacy notice. Custom domain later. |
| D8 | **Keep hosting cheap if traffic spikes.** Recommended host: Cloudflare Pages (see Approach §5 and Open question 1). |
| D9 | The maker has reviewed the Mandarin narration. **Note:** after that answer, snowflake `dc263e3` planned restoring the earlier Yun voice in new revisions. The release ships whichever Mandarin revision is *active* when it is built (see Preconditions). |

## Why (reasoning the implementing agent needs)

1. **`public/` is not a publication list.** Vite copies all of `public/` into the build. Today
   `dist/` is 732 MB and 196 files, including 250 MB of `/film/part-1` timing WAVs, eight dated
   narration revisions (438 MB, six of them superseded drafts), E02 narration, and assets for
   ~25 experiment routes. A static host serves every file, linked or not. A hidden route or an
   unreleased flag does **not** unpublish its assets.
2. **Unreleased code leaks through the bundle too.** `src/series/SeriesHome.tsx:5` imports
   `EpisodeTwo` statically, so E02's content JSON and visuals are compiled into the public
   JavaScript even though `EPISODE_TWO_RELEASED = false` prevents mounting. D1 requires that
   E02 be absent from the public bytes, not merely hidden.
3. **The existing `npm run build` → `dist/` must keep working unchanged.** The export tools
   depend on the full local build: `scripts/export-series-e01.mjs` serves `dist/` and captures
   `/series?seriesCapture=1`; `scripts/export-part1-full.mjs` asserts
   `dist/film/part-1/index.html`; `scripts/film-content.mjs` writes film HTML into `dist/`.
   Changing what `npm run build` emits would silently break completed export tooling.
   **Therefore the public site is a separate build mode with its own output directory.**
4. **Clean URLs touch code, not just hosting.** `src/series/SeriesHome.tsx:17-18` decides direct
   episode entry from `location.pathname === '/series/episode-1'`; ~20 scripts under `scripts/`
   (tests, export, capture, live checks) use `/series` paths; and
   `src/series/EpisodeOne.tsx:334` links to `/film/part-1` ("The original 35-minute film
   remains here"), which is a dead link publicly.
5. **Cost.** One full E01 viewing downloads roughly 25–30 MB (narration MP3s ≈ 21 MB each at
   128 kbps, measured with `ffprobe` on
   `public/series/narration/2026-09-17-e01-hook/e01-complete-paced.mp3`: 957.4 s, 128007 bit/s;
   only the selected language loads, `preload="metadata"`; plus the Run B volume
   `public/growth/run-b-growth-v1.bin` 7.3 MB and opening sound 3.7 MB). Firebase Spark's daily
   transfer allowance covers only about a dozen viewers; Firebase Blaze bills per GB of egress
   with no hard cap. A static host with no egress fees removes the "popularity bill" risk.

## Preconditions (check before step 1; stop and ask if any fails)

- **Website repo state.** At planning time `/Users/clipper/github/snowcrystal_website-film-part1`
  is on `explore/film-part1` at `e3bfbb4`, tracking `origin/feature/growth-library` (ahead 32;
  no `origin/explore/film-part1` exists), with two dirty files
  (`scripts/generate-series-narration.mjs`, `scripts/series-bilingual-audio.test.mjs`) owned by
  the concurrent Yun-voice session. **Do not edit, commit, stash or revert them.**
- **Snowflake repo state.** `explore/film-part1-plan` at `dc263e3`. The untracked
  `.firebaserc`, `firebase.json` and `public/` (Firebase placeholder page) at the snowflake root
  were created by the maker; leave them until the maker disposes of them (step 9).
- **Mandarin audio sequencing.** Steps 1–6 may proceed in parallel with the Yun work. The
  preview deploy (step 7) and live deploy (step 9) wait until the Yun workstream has landed
  and the maker has approved it, **or** the maker explicitly says to ship the current Susan
  revision. Never hard-code a narration revision in release tooling; derive it (step 3).
- **Host accounts.** Cloudflare Pages needs a Cloudflare account and `wrangler login` performed
  by the maker (the agent never handles credentials). If the maker keeps Firebase instead,
  `firebase login` is already active as the maker's account, and project `nivogenesis`
  (site `https://nivogenesis.web.app`, currently the Firebase placeholder) exists.

## Approach

1. **Isolation (Rule 16).** Create one branch `release/nivogenesis-public` in one new worktree
   of the website repo (for example `/Users/clipper/github/snowcrystal_website-release`),
   branched from the committed head of `explore/film-part1`. Run `npm ci` there. The Yun session
   keeps the existing checkout. Before release, rebase onto the then-current
   `explore/film-part1` head that contains the approved Mandarin revision.
2. **Clean routes in every mode.** The series home lives at `/` and Episode 1 at
   `/episode-1` (Episode 2 at `/episode-2`, still gated by `EPISODE_TWO_RELEASED`) in dev and
   production alike, so the public URLs are the ones tested locally. The experiments index
   (`HomePage`, today at `/`) moves to `/experiments` and remains in dev and the full local
   build only. Update `SeriesHome.tsx`'s path checks and every script, test and export URL that
   uses `/series…` in the same change. Local-only old URLs `/series` and `/series/episode-1`
   redirect in-app to the new paths so existing local notes and habits keep working; they were
   never public, so the host needs no redirects.
3. **Two build modes.**
   - `npm run build` → `dist/`: unchanged full local build (all routes, all of `public/`,
     export tooling intact). Only the path changes from step 2 apply.
   - `npm run build:public` → `dist-public/` (gitignored): Vite `--mode public`.
     - **Routes:** the router registers only the public routes plus a not-found page when
       `import.meta.env.MODE === 'public'`; experiment and film routes live behind that
       compile-time condition so their dynamic imports are eliminated from the public bundle.
     - **E02:** `EpisodeTwo` becomes a lazy import that the public build eliminates while
       `EPISODE_TWO_RELEASED` is false, so no E02 text, cues or visuals are compiled in.
     - **Footer:** the `/film/part-1` footer link renders only outside public mode.
     - **Assets:** `publicDir` is disabled for this mode; a small build step copies exactly
       the files named by the release allowlist into `dist-public/`.
4. **Release allowlist, derived where possible.** Commit `release/public-assets.json` (or an
   equivalent in the build script) with two parts:
   - *Derived:* the active narration files, read at build time from the `src` fields of
     `src/series/episode-narration.json` and `src/series/episode-one-narration.zh-CN.json`,
     plus any cue/subtitle files those scores reference. This is how the Yun switch flows
     through without editing release tooling.
   - *Listed:* every other runtime file the public pages load — expected at minimum the
     Run B volume `/growth/run-b-growth-v1.bin`, the opening sound
     `/series/sound/nivogenesis-opening-v1.wav`, the favicon/icons, and whatever the opening
     collection and Hero1 snowfall fetch. **Trap:** the opening collection shows recorded
     plate, column, hollow column, capped column and sectored plate crystals, and the only
     recorded volumes of those are under `public/growth/episode-2/` (referenced by
     `src/series/episode-two-crystals.json`). If the opening fetches them, they are public
     assets despite the folder name; confirm by network trace, do not guess from paths.
     Likewise confirm whether `/growth/library/index.json` is requested (only a README is
     tracked there) and whether `/series/e01-opening-isla-sterling.mp3` is still used.
   Build the list from a real network trace, then keep it explicit.
5. **Host: Cloudflare Pages (recommended, pending Open question 1).** Deploy `dist-public/`
   with `wrangler pages deploy`. At the time of planning its free tier advertised no egress
   charge and a 25 MiB per-file limit; **re-verify current limits and pricing on Cloudflare's
   pages before relying on them** and record what was checked. The largest expected public file
   is a ~21 MB narration MP3, under that limit; the release test enforces the limit. Headers
   and fallback go in `dist-public/_headers` (and `_redirects` only if needed), generated by the
   public build. Cloudflare serves `index.html` for unknown paths when no top-level `404.html`
   exists, so the SPA's not-found page handles unknown URLs (a soft 404; acceptable here).
   *Firebase fallback, if the maker keeps it:* put `firebase.json` + `.firebaserc` in the
   website repo with `"public": "dist-public"`, the SPA rewrite, the same headers, and the
   project on Blaze with a budget alert. Budget alerts notify; they do not cap spend.
6. **Headers.** `index.html`: `no-cache`. `/assets/*` (content-hashed): long-lived immutable.
   Narration/binary assets: moderate caching (narration folders are revision-named; `.bin`
   and `.wav` are not versioned — do not mark them immutable). COOP/COEP
   (`same-origin` / `require-corp`) are set in `vite.config.ts` for the dev/preview servers;
   determine whether any public page needs `crossOriginIsolated` (search `SharedArrayBuffer` /
   `crossOriginIsolated` usage reachable from the public routes, e.g. `src/lib/caps.ts`). Ship
   them only if needed, and then verify nothing public breaks under `require-corp`.
7. **Metadata (D4).** Replace the "Cryosphere — a snow crystal field study … WebGPU"
   title/description/Open Graph text in `index.html` with Nivogenesis copy drawn from the
   current opening (the opening line is **"Every flake is a record of its fall."**; read
   `src/series/SeriesHome.tsx` and `src/series/series-ui.zh-CN.json` for the current wording).
   Add `og:image` (1200×630) rendered from the current Run B crystal opening, plus
   `og:url` and `twitter:card`. The maker approves the final title, description and image
   before the live deploy. Single `index.html`; no per-language metadata (D3).

## Steps

- [x] **0. Plan committed** in snowflake (this file) and a pointer added to `docs/PROGRESS.md`.
- [x] **1. Worktree** `release/nivogenesis-public` created per Approach §1; path, base commit,
      purpose and removal condition recorded in this plan. Check: `git worktree list --porcelain`.
- [x] **2. Clean routes** (Approach §2). Check: the focused series tests pass with updated
      URLs — `node --test scripts/series-release.test.mjs scripts/series-opening-sound.test.mjs
      scripts/series-localization.test.mjs scripts/series-continuous.test.mjs
      scripts/series-export.test.mjs scripts/series.test.mjs
      scripts/series-bilingual-audio.test.mjs scripts/series-reading.test.mjs`; `npm run build`
      still produces `dist/film/part-1/index.html`; a dev-server check shows `/` = series home,
      `/episode-1` = direct E01 entry, `/experiments` = old index.
- [x] **3. Public build mode** (Approach §3) with allowlist copy (Approach §4) and generated
      `_headers`. Check: `npm run build:public` succeeds; `npm run build` output unchanged
      apart from the step 2 path changes.
- [x] **4. Release test** `scripts/public-release.test.mjs`, run against `dist-public/`, fails
      if any of these hold:
      - a file outside the allowlist is present;
      - an allowlisted or score-referenced file is missing;
      - any file is ≥ 25 MiB;
      - any path matches `/film/`, `e02`, `episode-two`, `export/`, or a narration revision
        that is not active;
      - a public JS chunk contains an E02-only string (pick two distinctive E02 lines from
        `src/series/episode-two.json`) or an experiment-route component name;
      - `index.html` contains "Cryosphere".
      Each check gets a negative control that plants the offending file or string in a temp
      copy and confirms the test fails (Rule 9) — keep this to one small test file, not a new
      verification framework.
- [x] **5. Live-browser smoke on `dist-public/`**, served by a local static server that mimics
      the host fallback (Playwright with `executablePath: '/opt/pw-browsers/chromium'` only if
      the pinned Playwright cannot find its browser; on the Mac use the project's existing
      setup):
      - load `/` and `/episode-1`, desktop and phone viewports;
      - toggle EN ⇄ 中文 without remount;
      - start E01 playback in each language;
      - press **Play with sound** on the opening;
      - check that `/episode-2` and `/kimi` show the not-found page;
      - check that every network request returns 200 and lies inside the allowlist.

      Record results in website `docs/public-release-verification.json`, following the existing
      `docs/series-*-verification.json` style.
- [x] **6. Metadata and preview image** (Approach §7) drafted; maker approves copy and image.
- [x] **7. Preview deploy** (after the Mandarin precondition is met): Cloudflare
      `wrangler pages deploy dist-public --branch preview` (or Firebase
      `firebase hosting:channel:deploy preview --expires 7d`). Note: preview URLs are public to
      anyone who has the link. Maker clicks through on desktop and phone.
- [x] **8. Independent science review (D6, Rule 13)** of the public E01, run while or after the
      preview is up. Reviewer: a different model from the one that implements this plan, with
      no shared context. Scope:
      - the performed English narration text;
      - on-screen text and diagram labels;
      - the Mandarin text, for scientific fidelity (qualifiers, numbers and causal claims,
        not style). If the Yun-voice plan's independent translation review already covers
        Mandarin scientific fidelity for the shipped revision, cite it rather than repeating it.

      Record at snowflake `docs/reviews/nivogenesis-e01-public-science-review-<date>.md` with
      Rule 10 provenance and stated limits. Defects are fixed and re-checked before step 9.
- [x] **9. Live deploy** from a committed, pushed head of `release/nivogenesis-public`, never
      from a dirty tree. Record the host URL, commit, `dist-public/` file count and total bytes,
      and the release-test result in this plan and `docs/PROGRESS.md`. The maker decides the
      fate of the snowflake-root Firebase placeholder files and, if Cloudflare is chosen,
      whether to keep the Firebase project.
- [x] **10. Rule 16 reconcile:**
      - merge or hand off the release branch into the website's retained branch as the maker
        directs;
      - remove the release worktree;
      - record the surviving branch, head and checks.

**Verification tier (Rule 6):** this is isolated product work. Use the focused website tests,
`npm run typecheck`/`tsc -b` via the build, both builds, the release test and the live-browser
smoke. Do **not** run snowflake `npm test`, scientific gates or solver suites; the science
review in step 8 is a content audit, not a solver check.

## Done when

- `https://<chosen host>/` serves the Nivogenesis opening and `/episode-1` enters Episode 1
  directly. EN / 中文 switching and E01 playback work on desktop and phone in the live browser
  smoke.
- `scripts/public-release.test.mjs` passes on the deployed `dist-public/` and every negative
  control fails as designed.
- Nothing from experiments, `/film/part-1`, non-active narration revisions, E02 or `export/`
  is present in the deployed files or public bundle.
- The page title and preview show Nivogenesis, and the maker has approved the copy and image.
- The step 8 science review is recorded with no open defects.
- The deploy came from a committed, pushed commit recorded in `docs/PROGRESS.md`.
- `npm run build` still produces the full local `dist/`, including
  `dist/film/part-1/index.html`, and the export scripts' URLs are updated.

## Out of scope

- Deleting, moving or re-encoding anything in the repository (old film, WAVs, drafts, E02,
  `export/`). The 35-minute film's WAVs are simply not shipped; re-encoding them is unnecessary.
- Releasing Episode 2 or flipping `EPISODE_TWO_RELEASED`.
- Language URLs, browser-language detection, analytics, cookie/privacy banner, custom domain.
- Re-encoding narration to lower bitrates. This would cut bandwidth by about half, but it
  changes shipped audio and needs a new retained revision and timing re-check; it would be a
  separate plan if cost ever matters.
- Any change to narration text, timing, visuals, science content (other than fixes the step 8
  review requires), solver, evidence or snowflake gates.
- Building a generic deployment framework or CI pipeline. One build script, one test, one
  documented deploy command.

## Second-pass review, corrections and maker decisions — 2026-09-18

A seven-agent fact check (build, code, a live network trace of the opening, governance, hosting; two
critics) verified the plan against website `e343142` and snowflake `ad7b065`; the full record is the
local `out/nivogenesis-release/plan-review-2026-09-18.json`. Direction, D1–D9, the separate public build
mode, the score-derived allowlist and the release test all hold. The corrections and decisions below
supersede the conflicting sentences above; earlier text is kept as the planning record.

### Maker decisions, second pass (do not relitigate)

| # | Decision |
|---|---|
| D10 | **Host: Firebase Hosting**, project `nivogenesis`, site `nivogenesis.web.app`, **Spark plan**. Past 10 GB/month of transfer the site goes offline until the next month with zero bill; that failure mode is accepted. Cloudflare is withdrawn (it was raised only over WAV size). |
| D11 | The site is empty today (no placeholder was deployed; `Site Not Found` is the empty state). The first real deploy populates it. |
| D12 | **Yun E01 Mandarin approved** (`2026-09-18-e01-mandarin-yun`). E02 stays frozen on its retained Susan revision, local only. |
| D13 | **The agent executes** the preview deploy, the live deploy and the push of the release branch. The plan's gates still precede the live deploy: release test, live smoke on the built output, and the step 8 science review with no open defects. Metadata, preview image and favicon are the agent's creative call and can be adjusted after launch. |
| D14 | Cache policy (agent recommendation accepted): `index.html` and page paths `no-cache`; `/assets/**` immutable one year; `.bin`, `.mp3`, `.wav` seven days (sha256-pinned volumes and revision-named narration folders); images one day. |
| D15 | **Published = released content only.** E02 remains local except the recorded models the opening needs. Those six models move out of `public/growth/episode-2/` into a general model folder `public/growth/models/` (more will follow); the catalog becomes a general recorded-models file used by both the opening and E02. |
| D16 | **No model label on the opening.** Model provenance for the opening collection goes where the numbers come from: the E01 Sources panel. E01-level labelling stays. The E01 disclosure wording becomes public-neutral (names Juniper and Yun rather than "the user-selected voice"). |
| D17 | D5 stands as the maker's statement: the narration is synthesized under a **paid ElevenLabs tier**; recorded, not verified by the agent. |
| D18 | A **new original favicon** (and the 1200×630 preview image) is authored by the agent. The scaffold `public/favicon.svg` and `public/icons.svg` are unused and do not ship. |
| D19 | The twelve E01 Sources links keep pointing at the public snowflake GitHub Pages site; a liveness check runs at release. |
| D20 | The Firebase config moves into the website repository (release worktree); the untracked snowflake-root `firebase.json`, `.firebaserc` and `public/index.html` placeholder are deleted now. |
| D21 | Branch structure: release work on `release/nivogenesis-public`, merged back into `explore/film-part1` after launch; the deployed commit is tagged `nivogenesis-public-2026-09-18`. Releases are tags on the one working branch, not a second long-lived line. |
| WAV | The only shipped WAV is the 20 s opening sound, 3,840,044 B (48 kHz stereo 16-bit PCM). Lossless FLAC gives 1,912,774 B (decode verified bit-exact by MD5); Opus 160 kbps gives 379,354 B but is lossy. Kept as WAV for this release (tests pin PCM; the saving applies only when Play with sound is pressed); FLAC is an optional follow-up. The 261 MB film timing WAVs are synthesized tones that never ship. |

### Corrections that change execution

1. **Chrome suppression.** `src/components/chrome/RootLayout.tsx:9` hides Nav, Footer, Grain and Lenis only for `/series` and `/film/part-1`. Chrome becomes route-driven (experiments only) and is absent from the public build entirely.
2. **Film plugin.** `scripts/film-content.mjs` is unconditional in `vite.config.ts:10` and hard-codes `dist/`. It is not applied in public mode; the public build asserts `dist/` and `public/film/` are untouched.
3. **Typed routes.** Every path stays registered in both modes so `tsc -b` passes; in public mode the non-public routes resolve to the home component and their dynamic imports sit behind `import.meta.env.MODE !== 'public'` so no experiment or film chunk is emitted. Unknown paths and `/episode-2` (while unreleased) show the home. The plan's local-only `/series` redirects are dropped (Rule 14); the three scripts that carry route URLs are updated instead.
4. **E02 elimination.** `EPISODE_TWO_RELEASED` becomes a build-time constant (Vite `define`) so the lazy `EpisodeTwo` import is dead code in the public build; the release test probes built chunks for distinctive `episode-two.json` prose and the E02 narration paths. Shared UI-dictionary strings are accepted.
5. **Allowlist by construction.** Copy only: the two E01 narration files named by the score `src` fields (E02 scores excluded while unreleased), `growth/run-b-growth-v1.bin`, `series/sound/nivogenesis-opening-v1.wav`, the six model volumes named by the catalog, the favicon and preview image. Never copy folders; the eleven loose root MP3s, film stills, the Isla Sterling sample and the scaffold icons are excluded by construction. `dist-public` is gitignored in the same commit.
6. **Step 5 criteria.** Statuses 200/206/304 with no 4xx/5xx or failed requests; the trace runs with WebGL2 and asserts the recorded markers loaded; not-found behaviour is checked by page content (the SPA rewrite returns 200). The local server is `firebase emulators:start --only hosting` on the real `firebase.json`.
7. **Numbers refreshed** (copied from the review artifacts): `dist/` 209 files, 773,810,058 B; English E01 narration 15,319,918 B; Mandarin 21,787,001 B; a full visit ≈ 42 MB (EN) / 48 MB (ZH) including the opening's 16.2 MB of models; Spark transfer quota is 10 GB per month (≈ 200–250 full viewings), not per day.
8. **No COOP/COEP.** Nothing reachable from the public routes uses `SharedArrayBuffer`; the headers are not shipped.
9. **Verification wording.** There is no `npm run typecheck`; typechecking is the `tsc -b` inside `npm run build`.
10. **Worktree record (Rule 16).** `/Users/clipper/github/snowcrystal_website-release` on `release/nivogenesis-public`, base `e343142`, purpose: public release implementation and deploy; removed after the merge in step 10. `/Users/clipper/github/snowcrystal_website` (`run-b-growth-stage`) is an unrelated ongoing worktree and is not touched.
11. **Firebase specifics.** Headers live in `firebase.json` `source` globs; the `**` rewrite outranks any 404 page; preview is `firebase hosting:channel:deploy preview --expires 7d`; live is `firebase deploy --only hosting --project nivogenesis` from the release worktree.

## Completion record — 2026-09-18

Live: **https://nivogenesis.web.app** (Firebase Hosting, project `nivogenesis`, Spark). Deployed from
website `30d05f6` (branch `release/nivogenesis-public`, pushed; tag `nivogenesis-public-2026-09-18`, pushed;
fast-forwarded into `explore/film-part1` at `fa26ecd`; release worktree and local branch removed).
Preview channel first: `https://nivogenesis--preview-l7a5exc7.web.app` (expires 2026-09-25).

Deployed `dist-public/`: **32 files, 74,390,477 bytes**; largest file the Mandarin narration at
21,787,001 B (website `docs/public-release-verification.json`, inventory with SHA-256 per file).
Public bundle chunks: SeriesHome, the growth worker, the entry and fonts only; no experiment, film,
chrome or Episode 2 chunk (release-test string probes pass). Assets shipped: the two active E01 narration
files, six recorded models from `public/growth/models/`, the Run B volume, the opening sound, four brand
files. Checks, all recorded in the website receipts: `npm run build` (unchanged local build, film edition
intact) and `npm run build:public` exit 0; **99 focused tests passed, 0 failed** including the release test
and its eleven negative controls; hosting-emulator, preview-channel and live smokes clean on desktop and
mobile emulation (routes, `no-cache` pages, immutable assets, seven-day media, WebGL2 markers 6/6,
EN/中文 playback and switching at story position, Play with sound, network inside the allowlist,
unknown and unreleased paths landing on the opening). Twelve GitHub Pages Sources links return 200.

Step 8 review: [nivogenesis-e01-public-science-review-2026-09-18.md](../reviews/nivogenesis-e01-public-science-review-2026-09-18.md)
(Opus reviewers, no shared context): 8 confirmed, 6 contested, 22 rejected; the five site-level fixes
landed in `30d05f6` before the live deploy; the chapter-level findings are deferred follow-ups for the
education content, not this deploy.

Records: website `docs/public-release.md`, `docs/public-release-verification.json`,
`docs/public-release-smoke-{emulator,preview,live}.json`. Local dev URLs changed with the clean routes:
the opening is `/`, Episode 1 `/episode-1`, the experiments index `/experiments`.

Open after launch: the maker's own viewing/listening on the live site; loudness matching (Mandarin about
3.6 LU below English) if wanted; the education-chapter follow-ups from the science review; the AMS
glossary links answer a bot challenge to automated clients; Episode 2 stays frozen and local.

### Second deploy — 2026-09-18, phone pass

Live from website `84af23f` (tag `nivogenesis-public-2026-09-18.2`, pushed; records at `71b25af`).
Trigger: the maker's iPhone report against `30d05f6` (PROGRESS, "Completed phone pass on the live
site"). Two rounds on the `ios` preview channel `https://nivogenesis--ios-dp3vhdsa.web.app` (expires
2026-09-25), the second after an independent three-lens review; the maker confirmed the preview on the
iPhone, then said "Promote". Deployed `dist-public/`: **31 files, 70,552,920 bytes** (the opening WAV no
longer ships; 13 allowlisted assets), largest the Mandarin narration at 21,787,001 B (website
`docs/public-release-verification.json`, regenerated in place; the first release's receipts remain at
`fa26ecd`). Checks: `npm run build` and `npm run build:public` exit 0; **99 focused tests passed, 0
failed** (release test unchanged since `30d05f6`); emulator, preview and post-deploy live smokes clean,
now also asserting that the opening sound control is absent and that English narration actually starts
after the card tap. D21 unchanged: releases are tags on `explore/film-part1`; `release/nivogenesis-public`
stays at `fa26ecd` on origin as the first-release line and is not advanced. Deferred, unchanged: the
education-chapter follow-ups, loudness matching, a custom domain; Episode 2 frozen, with the phone pass
still to be ported into `EpisodeTwo.tsx` before any release.

### Third deploy — 2026-09-19, series home redesign

Live from website `8ef55a9` (tag `nivogenesis-public-2026-09-19`, pushed; records `81f9bc6`), promoted without
a preview channel at the maker's direction after their Android and iOS test of the `home` channel. Scope in
the [series plan](explore-journey-science-series.md#opening-redesign-and-per-episode-loading--2026-09-19-planned-before-implementation).
Deployed `dist-public/`: **36 files, 70,553,846 bytes** (website `docs/public-release-verification.json`,
regenerated in place with SHA-256 per file); the public build now emits per-episode chunks (home 1,245 KB,
Episode 1 173 KB, its Mandarin score 159 KB). Checks: `npm run build` and `npm run build:public` exit 0;
**100 focused tests passed, 0 failed**; release test 2/2 with leak probes derived from the live Episode 2
scores; emulator and post-deploy live smokes clean, now also asserting the opening structure (Skip during
the opening, one Play after it, no cards in the opening), the chunk set on landing, the central Play and
the selection card each starting English narration. D21 unchanged: a tag on `explore/film-part1`.

## Tried and rejected

- **Publish `dist/` as is to Firebase** (the initial idea): rejected. It ships 732 MB, including
  the old film's 194 MB + 48 MB timing WAVs, six superseded narration revisions, E02 audio, and
  ~25 experiment routes.
- **Firebase config at the snowflake root pointing at a placeholder `public/`**: wrong
  repository; the site is built in the website repo. Superseded by Approach §5.
- **Option A, redirect `/` → `/series`**: offered as the lower-effort path; the maker chose
  clean URLs (D2).
- **Make `npm run build` itself public-only**: rejected. It breaks the export tooling that
  depends on `dist/` (Why §3).
- **Hide experiments by removing navigation links only**: rejected. Routes and assets would
  still be reachable (Why §1–2).
- **`/zh` language paths**: offered; the maker rejected them (D3).

## Open questions

1. **Host (maker).** Cloudflare Pages (recommended: no egress fees, needs a Cloudflare account)
   or keep Firebase (already set up; needs Blaze + budget alert; costs scale with traffic)?
2. **Mandarin revision to ship (maker).** The active one after the Yun work lands (default), or
   explicitly Susan now.
3. **Where the release branch merges** after launch (maker): into `explore/film-part1`, or kept
   as the long-lived public release line.
