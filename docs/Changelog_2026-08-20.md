# Changelog — 2026-08-20

## Session: All 8 real TouchDesigner clips + gallery feature tile wired in

**Title:** Compressed and shipped the user's full `D:\TouchDesigner\Github_Portfolio` batch (8 clips + a gallery-mockup image), fixed two aspect-ratio mismatches the bento CSS had been guessing at, and added a fourth bento card type for a bigger standalone square tile.

**Source inventory (`ffprobe` on every file, since the user renamed things mid-session — re-read the folder rather than trusting the earlier listing):**

| Source | Real dims | → | Compressed size |
|---|---|---|---|
| `FlexGHPages.mov` (already done) | 727×1280 | `clip01.mp4` | 2.8 MB |
| `GHP1_Tall.mp4` | 1080×1920 | `clip02.mp4` | 19.5 MB |
| `GHP2_Sq.mp4` | 1080×1080 | `clip03.mp4` | 8.7 MB |
| `GHP3_Sq.mp4` | 1080×1080 | `clip04.mp4` | 4.5 MB |
| `GHP4_Tall.mp4` | 1080×1920 | `clip05.mp4` | 17.2 MB |
| `GHP5_Tall.mp4` | 1080×1920 | `clip06.mp4` | 21.1 MB |
| `GHP6_Sq.mp4` (user renamed from `_Tall`, real dims are square) | 1080×1080 | `clip07.mp4` | 8.0 MB |
| `GHP_Wide.mov` | 1280×853 | `clip08.mp4` | 2.0 MB |
| `GHP7_Gallery.jpeg` (new mid-session — the gallery-mockup composite) | 1024×1024 | `screenshots/gallery-mask.jpg` | 900 KB (uncompressed, already reasonable) |

All 7 video re-encodes used the same recipe as `clip01`: `fps=30`, even-dimension scale fix, `libx264 -crf 22 -preset slow`, no audio, faststart. Poster frames pulled at the 2s mark. Total `public/videos/` footprint: ~85MB across 8 clips.

**Two real ratio mismatches fixed with actual data, in `src/index.css`:**
- `--td-side-ratio` was `4/5` (guessed) — the real square clips are exactly `1080×1080` (1:1). Changed to `1/1`, and recomputed the dependent `grid-template-columns` fr value from `1.42fr` → `1.13fr` (same formula as before, just re-run with the corrected ratio — these two numbers have to move together or the tall card's box stops matching its own `aspect-ratio`).
- `.grid-bento-wide`'s ratio was a guessed `21/9` (cinematic banner) — the real wide clip is `1280×853`, which is almost exactly `3:2`. Changed to `3/2`; also added `object-fit: contain` there (was missing — the wide block never got the same crop-safety treatment the tall block did).

**New `'feature'` bento block, for the gallery-mockup image:** `.grid-bento-feature .card { aspect-ratio: 1/1; max-width: min(480px, 100%); }` — a bigger, left-aligned square tile, distinct from the `1:1` secondary tiles in a trio. `App.jsx`'s `groupForBento()` generalized from a `'wide'`-only check to a `SOLO_LAYOUTS` set (`wide`, `feature`) so either tag breaks a clip out into its own row; the block-type-to-className logic generalized to `grid-bento-${block.type}` for any non-trio/non-plain type instead of hardcoding just `wide`.

**`src/projects.js` fully populated:** all 9 entries (8 clips + the feature image) with real `BASE_URL`-prefixed paths and `layout` tags, ordered so tall clips lead each trio where possible. With 4 tall + 3 square clips among the 7 trio-eligible ones, one tall clip (`clip06`) is structurally left over — flagged in its own `desc` field and in a file-level comment, since 7 isn't divisible by 3. Titles/descriptions for clips 02–08 are left as clearly-marked placeholders — I don't know the real content behind generic filenames like `GHP2.mp4`, so I didn't invent specific technical claims (technique, inputs, etc.) the way I initially did for `clip01`; the user should replace these with real copy.

**Notes:** Verified via `npm run dev` (HTTP 200) and confirmed all 8 videos + 8 posters + the gallery image return HTTP 200 at their real dev-server paths (not just checked one and assumed the rest). `npx oxlint` clean on `App.jsx`/`projects.js`. Still no visual browser check this session (`claude-in-chrome` not connected) — this is now several rounds of bento-sizing changes without a visual look; strongly worth an actual look before calling the layout finished, especially the leftover `clip06` card and the new feature tile's size relative to the rest.

---

## Session: Gallery image + wide clip lost their card chrome; GHP1_Tall demoted

**Title:** User felt the bento "looked not so good" once all 8 real clips were in — three concrete fixes: strip the card treatment off the gallery image and the wide clip (plain media only), and shrink `clip02` (GHP1_Tall — "didn't come out well") from the big hero slot to a small side tile.

**Card chrome removed for `feature`/`wide` (`src/App.jsx`, `src/index.css`):** these two block types no longer render through `Card.jsx` at all — no border, no box-shadow, no hover-flip, no text overlay. `feature` is now a plain `<img>`; `wide` is a plain `<video autoPlay muted loop playsInline>` that's always playing, not hover-to-preview. Removed the now-dead `.grid-bento-wide .card` / `.grid-bento-feature .card` CSS (nothing renders through `.card` for these anymore) and replaced with direct `.feature-media` / `.wide-media` rules — same `1:1` / `3:2` ratios as before, still `border-radius: 16px` for visual consistency with the rest of the site, just without the card mechanics.

**`clip02` (GHP1_Tall) demoted (`src/projects.js`):** `layout` changed from `'tall'` → `'square'`. Since a trio's big hero slot is decided by array *position* (first-of-3), not by the item's own tag, simply changing the tag wasn't enough — reordered the array so `clip05` (an actually-tall clip) leads that trio instead, with `clip02` sliding into a side-tile slot alongside `clip07`. That's roughly a third of its previous on-page footprint, addressing "resize to 1/3" as a layout demotion rather than a literal pixel/file resize.

**Brainstormed with the user (not yet acted on):** the recurring "one clip always left over" issue (7 trio-eligible clips ÷ 3) is structural, not a bug — it'll persist until the count changes or `clip06` gets its own solo treatment like `wide`/`feature` did. Flagged as an option for a future round rather than deciding unilaterally.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `App.jsx`/`projects.js` (no errors). Still no visual browser check this session — this is now four-plus rounds of bento layout changes without one; genuinely due for an actual look.

---

## Session: Bento moved from auto-grouping to hand-authored rows (bespoke layout)

**Title:** User dictated a specific 4-row composition (wide clip, a standard trio, a *mixed-media* trio with the gallery photo + a mini clip + a new text-only card, and a *mirrored* trio with the tall slot on the right) — beyond what the tag-based `groupForBento()` algorithm could express. Replaced it with explicit, hand-authored rows.

**Why the auto-grouper had to go:** it only knew how to do one shape (tall-left, square-right) plus two solo-row escape hatches (`wide`, `feature`). This request needed: the gallery image participating *inside* a trio instead of alone, a brand-new text-only card type, and a fully mirrored trio (square-left, tall-right) — none of which a "walk the array, group by tag" algorithm can express without becoming a much larger rules engine. Once the requirement is "compose this specific arrangement" rather than "handle N clips generically," explicit authorship is simpler and more honest than more inference logic.

**`src/projects.js` restructured:** all 8 clips + the gallery image are now named consts (`clip01`...`clip08`, `gallery`), plus a new `audioReactivity` const — a card with no `video`/`image` at all, just `title`/`desc`/`grad`/`initial`, which needed zero new code since `Card.jsx` already falls back to a gradient+initial front face with hover-reveal text for media-less entries. `tdProjects` (flat list, still used for the "N clips" count) and a new `tdLayout` (the actual row composition) are both exported, built from the same objects — no data duplication.

`tdLayout`:
```js
[
  { type: 'wide', items: [clip08] },
  { type: 'trio', items: [clip01, clip03, clip04] },
  { type: 'trio', items: [gallery, clip06, audioReactivity], cropHero: true },
  { type: 'trio-reverse', items: [clip02, clip07, clip05] },
]
```
This also incidentally resolves the long-running "one clip always left over" problem from earlier sessions — every one of the 8 real clips plus the gallery image now has an explicit, intentional home; nothing falls through to the `plain` 4:3-cropped fallback anymore.

**New `.grid-bento-reverse` (`src/index.css`)** — the mirrored trio (square-left ×2, tall-right). This could *not* reuse `.grid-bento`'s auto-placement trick (spanning item first in DOM order, so it claims a column before the other two fill the row cells it needs) — with the spanning item *last*, the other two already occupy both columns' first row by the time it's placed, and the grid engine pushes it into new implicit rows instead of spanning as intended. Fixed by giving every card in this variant an explicit `grid-column`/`grid-row` via `nth-child`, rather than relying on auto-placement order at all.

**New `cropHero` row flag → `.grid-bento--crop-hero`:** the gallery image (1024×1024, perfectly square) sitting in the tall/portrait hero slot (shaped for ~726:1280 content) would otherwise show a large letterbox gap under the existing `object-fit: contain` rule — too big a mismatch to treat like the ~1080:1920 clips' negligible ~0.8% difference. `cropHero: true` on that row switches just its hero slot to `object-fit: cover`, trading a photo crop (acceptable for an atmospheric/contextual image) for no gray bars.

**`App.jsx`** simplified to map directly over `tdLayout` — no grouping algorithm left, just three row-type branches (`wide`, everything else keyed off `trio-reverse` vs default `trio`).

**Education:** CSS Grid auto-placement is order-dependent in a way that's easy to miss — a technique that works because a spanning item happens to be first in DOM order will silently break if you reorder the array, and the failure mode (items pushed into extra implicit rows) doesn't throw an error, it just looks wrong. Explicit `grid-column`/`grid-row` placement is more verbose but doesn't have this landmine.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `App.jsx`/`projects.js` (no errors); confirmed no leftover references to the removed `feature` row type or `groupForBento`/`chunk3` in `src/`. Still no visual browser check this session — the mirrored `.grid-bento-reverse` in particular is new, untested-by-eye CSS and the one most worth actually looking at before trusting it.

---

## Session: Gallery/squares row flipped to the mirrored layout

**Title:** Row 3 changed from gallery-left/squares-right to squares-left/gallery-right — exactly the `trio-reverse` type built moments earlier, so this was a data change, not new CSS, except for one gap the new combination exposed.

**`src/projects.js`:** row 3's `type` changed `'trio'` → `'trio-reverse'`, items reordered to `[clip06, audioReactivity, gallery]` (`trio-reverse` expects `[square, square, tall]`, tall last).

**Gap found and fixed:** `cropHero` (added for this same row last round) only targeted `.card:first-child` — correct for a forward trio's hero slot, but `trio-reverse`'s hero card is the *third* child, not the first. Extended the `.grid-bento--crop-hero` CSS to also cover `.grid-bento-reverse.grid-bento--crop-hero .card:nth-child(3)`, so the flag works correctly regardless of which direction the row it's applied to.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `projects.js` (no errors).

---

## Session: Two new Card render modes — `plain` (media only) and `static` (text, no flip)

**Title:** User wanted several specific cards stripped down: clip04/clip05/clip07/gallery lose the hover-flip text box entirely and just show their media (video autoplaying on loop, or the static gallery image); the new "Live Performance" text card keeps its text but drops the hover-to-reveal animation, since the whole point of that card is the statement itself.

**`src/Card.jsx`:** two new opt-in flags read off the project object:
- **`p.plain`** — skips the `.card-text-flip` layer entirely (no text, no play-badge), skips the hover-triggered video play/pause (video autoplays instead via `autoPlay` when `p.plain`), and skips `clickable`/lightbox behavior. Still renders inside `<article className="card">` — critical, since the bento CSS's grid-slot sizing (`aspect-ratio`, tall/square placement) is keyed off the `.card` class, not off whether it has a text layer. Losing that would break the row's shape entirely.
- **`p.static`** — keeps the text layer, but adds `card-text-flip--static`, which zeroes out the rotation transform and transition. Text is visible at rest and stays that way regardless of hover/focus.

**`src/index.css`:** `.card--plain` neutralizes the border/box-shadow hover treatment (`border-color: transparent`) since there's no text needing to be "revealed" by a hover cue anymore. `.card-text-flip--static` needed higher selector specificity (`.card-text-flip.card-text-flip--static`) than the existing `.card:hover .card-text-flip` rule to reliably override it regardless of source order, rather than relying on being declared later in the file.

**`src/projects.js`:** `clip04`, `clip05`, `clip07`, `gallery` all got `plain: true`; `audioReactivity` got `static: true`.

**Also fixed a real letterbox artifact on `clip05`:** it sits in a trio-reverse's tall-hero slot (shaped for the site's usual ~726:1280 portrait ratio), but its real dimensions are 1080×1920 — under 1% off, but enough of a mismatch that `object-fit: contain` left a thin gray sliver on the sides. Enabled `cropHero: true` on that row (the same toggle built for the gallery photo earlier) rather than trying to patch the background color — cropping an imperceptible sliver off a near-matching ratio beats leaving a visible seam.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `Card.jsx`/`projects.js` (no errors). Still no visual browser check this session — worth confirming the `plain` cards' rounded corners and the `static` text card's permanent visibility both read as intended, and that clip05's crop doesn't cut off anything important.

---

## Session: Diagnosed a real baked-in video artifact, and the profile photo "grainy" question

**Title:** User reported black in `clip05`'s background and asked why the sidebar profile photo looks grainy. Investigated both with actual evidence (extracted frames, checked source files) rather than guessing.

**`clip05` (GHP4_Tall) black seams — confirmed baked into the source, then confirmed fixed:** extracted a frame from both the compressed `clip05.mp4` and the raw `D:\TouchDesigner\Github_Portfolio\GHP4_Tall.mp4` — identical thin black divider lines between three tiled panels in both, proving it came from the TouchDesigner render itself, not from ffmpeg compression or any CSS (`object-fit`/`cropHero` can't remove content baked into the video's actual pixels). Reported this rather than attempting a CSS workaround that couldn't have worked. User re-exported the clip themselves; re-compressed the updated `GHP4_Tall.mp4` (same recipe: `fps=30`, even-dim scale, `libx264 -crf 22 -preset slow`) → new `clip05.mp4` (15MB) + poster, replacing the old ones. Extracted a frame from the new file and confirmed the black lines are gone (light gray remains in a couple of small gaps, not black) before telling the user it's fixed.

**Profile photo graininess — ruled out both files and CSS as the cause, asked for more info:** checked the actual source (`prof_thumbnail.png`, 1229×1280, viewed directly — clean, no visible grain) and every relevant CSS rule (`.profile-photo`, `.profile-panel`, ancestors) for `filter`/`backdrop-filter`/`image-rendering`/blend-modes — none present. The image is being *downscaled* (1229px source → ~190–250px display), not upscaled, so it's not a "manipulated size" stretching artifact. Most likely explanation left standing is browser-side sub-pixel scaling at a non-round display width, but that's a guess, not a verified finding — said so explicitly and asked for a screenshot or a more specific description rather than proposing a fix for an unconfirmed cause.

**Education:** When a visual defect could come from several layers (source asset vs. compression vs. CSS vs. browser rendering), check each layer with actual evidence before touching code — extracting a frame and diffing it against the source took under a minute and definitively ruled out "is this our compression's fault," which a CSS-only fix attempt would not have caught (and could have wasted a round-trip chasing the wrong layer).

**Notes:** Verified `clip05.mp4`/`clip05.jpg` return HTTP 200 at their dev-server paths. No visual browser check for the profile-photo question — genuinely blocked on that one without either browser access or a screenshot from the user.
