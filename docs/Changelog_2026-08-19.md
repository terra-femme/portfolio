# Changelog — 2026-08-19

## Session: ASCII koi fish in the sidebar

**Title:** Added an ASCII koi fish, mouse-reactive and confined to a small "tank" below the profile panel.

**Fix:**
- New `src/KoiFish.jsx` — a 7-character ASCII fish (`< ° ( ( ( ° >`, colored blue/green with two small yellow accent dots for the eye and tail spot) rendered inside `.koi-tank` (a bordered, rounded box with a soft gradient background), placed directly after `<LeafSprout />` inside the `<aside className="profile-panel">` in `App.jsx`.
- Idle motion: a bounded sine-wave drift computed against the tank's own `getBoundingClientRect()` each frame, so the fish's position is mathematically confined to the tank's interior (with `overflow: hidden` on `.koi-tank` as a hard backstop). The tail glyphs also get a small independent CSS `koi-tail-flick` keyframe wiggle layered on top.
- Orientation: a `window` `mousemove` listener tracks the cursor anywhere on the page; each animation frame computes the angle from the fish's current center to the mouse, flips the fish horizontally (`scaleX`) to face left/right, and tilts it up to 30° to face up/down — clamped so it never flips upside down.
- All per-frame position/rotation writes go straight to `fish.style.left/top/transform` via a ref (no React state in the rAF loop), matching the direct-DOM-mutation perf pattern `Card.jsx` already uses for its mouse-tilt effect.
- Respects `prefers-reduced-motion`: renders the fish centered and static, no listeners or rAF loop attached.

**Education:** Confinement here isn't done by clamping a free-roaming position after the fact — the sine-wave amplitude is derived directly from the tank's *current* usable width/height every frame, so the fish is structurally incapable of leaving the tank regardless of viewport size; `overflow: hidden` only exists as a defensive backstop.

**Best Practices:** Kept the animation loop reading fresh layout (`getBoundingClientRect()`) once per frame rather than caching it across a resize listener — simpler, and cheap enough for one small decorative widget (same tradeoff already made in `Card.jsx`'s mousemove handler).

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on the changed files (no errors). No visual browser verification — `claude-in-chrome` extension not connected this session — worth a manual check that the swim range and mouse-steering feel right at your screen size.

---

## Session: Koi fish rebuilt as canvas, replacing the ASCII version

**Title:** Scrapped the ASCII koi ("hated it") and rebuilt it as an HTML5 canvas fish, referencing a few public koi-animation projects for technique.

**Context:** User linked three references for what they wanted instead: a CodePen (blocked direct fetch — 403 — and the `claude-in-chrome` extension wasn't connected, so it couldn't be viewed), `github.com/Tyler-Chi/Koi-Fish` (a canvas koi pond sim), and `github.com/input-output-hk/koi-pond` flagged as "best" — which turned out to be a full Three.js/WebGL scene with custom GLSL water shaders, `UnrealBloomPass` post-processing, and real 3D fish models. Asked the user via `AskUserQuestion` whether to go full WebGL (feasible — the project already has `three`/`@react-three/fiber`/`@react-three/drei` installed for `Background3D.jsx`) or a polished 2D canvas that borrows the *aesthetic* (gradient fill, glow, smoother motion) without the 3D asset/shader lift. User chose the polished 2D canvas.

**Fix:**
- Rewrote `src/KoiFish.jsx` from scratch as a `<canvas>` component. Technique: a fixed-length trailing-point history of the head's own past positions (`TRAIL_LENGTH = 26`), with the neck/body/tail read back from specific lag-indices (`NECK_LAG`, `BODY_LAG`, `TAIL_LAG`) into that history — since those points are literally where the head *used to be*, the body naturally lags and curves through turns instead of rotating as a rigid block. This is the same family of technique referenced in `Tyler-Chi/Koi-Fish`'s angle-history approach, reimplemented independently for a single mouse-following fish rather than an autonomous multi-fish pond sim.
- Visual polish aimed at the IOHK reference's *feel* without its WebGL machinery: a blue-to-green `createLinearGradient` fill on the body (was flat color), a soft glow via `ctx.shadowBlur`/`shadowColor` standing in for a bloom pass, a slow-drifting radial-gradient "water shimmer" painted behind the fish each frame, and a yellow accent eye kept outside the glow pass so it stays a crisp dot.
- Steering/containment: unchanged in spirit from the ASCII version — the steer target is the mouse position clamped into the tank's rect, and the fish's own position is hard-clamped inside `EDGE_MARGIN` every frame, so it structurally cannot leave the tank regardless of where the real cursor is.
- `src/index.css` — replaced all the ASCII-era rules (`.koi-fish`, `.koi-glyph`, `.koi-blue/green/yellow`, `.koi-tail`, `@keyframes koi-tail-flick`) with a single simplified `.koi-tank` rule now targeting the `<canvas>` element directly (`display: block` — canvas defaults to inline and leaves stray whitespace otherwise).
- Canvas sized via `devicePixelRatio` + `ResizeObserver` for crisp rendering at any zoom/DPI, and it will pick up size changes automatically if the sidebar's width ever changes (e.g. at the 900px responsive breakpoint fixed earlier this week).
- Respects `prefers-reduced-motion`: draws one static frame, no listeners or rAF loop attached.

**Education:** "Trailing point chain" is the standard technique behind most mouse-following canvas creatures (fish, snakes, worm-drag effects) — record where the head has been, then read fixed distances back into that history for each body segment. It's cheap (no real physics/IK solver) and reads as fluid because the lag is literally true motion history, not a fake sine-wave approximation.

**Best Practices:** Investigated all three of the user's references before writing code (fetched the GitHub repos' actual source; CodePen was inaccessible and disclosed as such rather than guessed at) instead of assuming what "aesthetic" meant. Asked before committing to the larger WebGL scope, since that's a real time/complexity tradeoff only the user could make.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` (no errors). Still no visual browser check this session (`claude-in-chrome` not connected) — please eyeball the glow intensity, gradient direction, and swim feel; those are the easiest knobs to tune (`GLOW_COLOR`/`ctx.shadowBlur`, `BODY_COLOR_A`/`BODY_COLOR_B`, `MAX_SPEED`/`TURN_RATE` in `KoiFish.jsx`).

---

## Session: Koi fish freed from the tank — full-panel school of 21

**Title:** Removed the bounded "tank" at the bottom of the sidebar; the koi now roam the whole profile panel (photo included) as a top z-layer, and there are 21 of them now instead of 1.

**Fix:**
- `src/KoiFish.jsx` rewritten again: instead of one fish confined to a small `.koi-tank` box, `createFish()` now builds an array of 21 fish — 1 "hero" (the original blue-green gradient + glow fish) plus 20 "school" fish, each a different solid color drawn from `SCHOOL_PALETTE` (5 shades each of blue/green/yellow/pink, so every fish is visually distinct but stays in the requested scheme).
- Containment moved from "small box at the bottom" to "the whole panel": the canvas is now `.koi-pond`, `position: absolute; inset: 0; z-index: 5; pointer-events: none`, so it paints above the photo, caption, socials, and leaf sprout (positioned elements paint after normal-flow siblings regardless of DOM order — no z-index arms race needed with the rest of the panel) while never intercepting clicks/hovers on the social icons underneath.
- `.profile-panel` gained `overflow: hidden` so the koi are clipped to the panel's own rounded card rather than spilling into the main content column, and its `@media (max-width: 900px)` override changed from `position: static` to `position: relative` — `static` doesn't establish a containing block for the absolutely-positioned canvas, which would have let the fish escape onto the whole page once the sidebar goes non-sticky on mobile.
- Each fish now has its own **wander behavior** (a randomly-changing target inside the panel, re-picked every ~2–5s) blended with a per-fish-weighted pull toward the mouse (`mouseWeight`, randomized 0.08–0.35, hero weighted highest) — so the school drifts loosely toward the cursor like real koi approaching the edge of a pond, without rigidly stacking on one point. Both the wander target and the fish's own position are clamped to the panel's live rect every frame (same structural-containment approach as before, just against the full panel instead of a small tank).
- Performance guard: only the hero fish pays for the gradient fill + `shadowBlur` glow; the 20 school fish use flat colors and a plain fill, so 21 animated fish at 60fps stays cheap.

**Education:** Painting order in CSS doesn't depend on `z-index` alone — any positioned element (even at the default `z-index: auto`) paints after its non-positioned in-flow siblings within the same stacking context, which is why the koi canvas reliably sits above the photo/socials without needing to out-rank their own (default) stacking level.

**Best Practices:** Kept the wander/mouse-blend weights randomized per-fish rather than uniform, since a school where every member moves identically reads as a looping animation rather than something alive.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` (no errors). No visual browser check this session (`claude-in-chrome` not connected) — worth confirming the fish are actually clipped correctly at the panel's rounded corners and that 21 fish doesn't feel too busy over the photo; `SCHOOL_SIZE` and `mouseWeight` ranges in `KoiFish.jsx` are the easy knobs if it needs toning down.

---

## Session: Koi removed (archived as a reusable snippet); cards rebuilt as flip cards

**Title:** Pulled the koi pond out of the portfolio entirely (user didn't like it, despite the iteration), archived its code for future reuse, and replaced the project cards' mouse-tilt effect with a 3D flip revealing the text as a floating panel.

**Koi removal:**
- Deleted `portfolio/src/KoiFish.jsx`, its `<KoiFish />` usage in `App.jsx`, and the `.koi-pond` CSS rule.
- Reverted the two `.profile-panel` changes that existed only to support the koi overlay: removed `overflow: hidden`, and reverted the `@media (max-width: 900px)` override from `position: relative` back to the original `position: static`.
- Archived the final (school-of-21) version at `C:\Users\aznkr\Documents\Portfolio\code-snippets\koi-fish-canvas\` — `KoiFish.jsx`, `koi-pond.css`, and a `README.md` covering the technique, how to re-wire it into a future host container, the tunable constants, and the two GitHub references it was built from. This lives in the `Portfolio` parent folder (sibling to the `portfolio` project), not inside any one project, since it's not tied to this site specifically.

**Card flip redesign (`src/Card.jsx`, `src/index.css`):**
- Removed the old mouse-tilt effect entirely (the `onMouseMove`/`getBoundingClientRect`-driven `perspective(...) rotateY() rotateX()` inline transform, plus the hover-to-autoplay video logic — dropped because it conflicted with the new interaction: hovering now flips the card instead of previewing the video in place).
- New structure: `.card` (aspect-ratio 4/3, `perspective: 1200px`) → `.card-flip` (the actual `rotateY(180deg)` on hover/`:focus-within`, `transform-style: preserve-3d`) → two absolutely-stacked `.card-face` panels with `backface-visibility: hidden`.
  - **Front face** — the media asset (video poster / image / gradient-initial) at a clean full fit (`width/height: 100%`, `object-fit: cover`) — no artificial zoom, just filling the face cleanly, per the user's correction mid-task ("not zoomed in, just a full page fit").
  - **Back face**, revealed by the flip — tag/title/description sit inside `.card-text-float`, a visually distinct elevated panel (own background, border, and drop shadow) over a soft gradient backdrop, so the text reads as a floating layer above the card rather than plain body copy.
- `:focus-within` triggers the same flip as `:hover`, so keyboard users tabbing onto a clickable video card get the same reveal.
- Long descriptions are truncated with `-webkit-line-clamp: 4` on the back face instead of scrolling — both faces share one fixed aspect-ratio box now (no natural height from stacked content anymore), so overflow needed an explicit answer rather than being left to accident.
- `prefers-reduced-motion` now disables `.card-flip`'s transition (instant flip on hover/focus, no animated swoop) rather than disabling the whole `.card`'s transition as before, since the transform moved to the inner wrapper.

**Education:** Once two faces of a flip card are stacked with `position: absolute; inset: 0`, the container can no longer size itself from either face's content — it needs an explicit height (here, `aspect-ratio: 4/3` on `.card`), and any face with variable-length content needs its own overflow answer (line-clamp), because "let it grow" is no longer available.

**Best Practices:** Re-confirmed the requirement mid-task rather than assuming — user corrected "zoomed in" to "full page fit" partway through, so the front face was built to fill cleanly rather than crop in.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `Card.jsx`/`App.jsx` (no errors); confirmed no remaining `KoiFish`/`koi-pond`/`koi-tank` references anywhere in `portfolio/src`. No visual browser check this session (`claude-in-chrome` not connected) — worth confirming the flip timing/easing feels right and that the back-face text doesn't feel cramped for your longer project descriptions.

---

## Session: Card flip reworked — text on top by default, flips away (not a two-face swap) to reveal media

**Title:** User liked the flip direction but wanted the roles reversed (text default, media on hover) and, specifically, wanted the text to visibly *float above* the card during the flip animation itself — which meant the two-face design from earlier today was the wrong shape for the request.

**Why the previous two-face flip didn't fit:** In that version, text and media were two `backface-visibility: hidden` faces of the *same* rotating element (`.card-flip`) — each one only exists on its own side of a shared rotation, so mid-flip the text face is edge-on/foreshortened *as part of* the rotating card, not floating independently above it. Reversing which face was "front" would have solved the ordering but not the "floating above, higher z-index" ask.

**New model (`src/Card.jsx`, `src/index.css`):**
- `.card-media` — the media (video/image/gradient) is now a single, always-rendered, non-rotating layer at `z-index: 1`. It never moves; hovering doesn't swap it for a different face, it's simply uncovered.
- `.card-text-flip` — the text panel is a *separate* layer at `z-index: 2`, sitting above the media, and it is the thing that actually rotates (`rotateY(-180deg)` on hover/`:focus-within`) with its own `backface-visibility: hidden`. At rest it fully covers the card (text on top, as requested); on hover it flips away like a lid, and because it's a distinct higher-z-index layer rather than a face swapping with the media, it visibly floats above the media *during* the rotation instead of rotating in lockstep with it — literally the z-index manipulation the user described, just applied to a rotator instead of a static overlay.
- Restored video hover-autoplay (`onMouseEnter`/`onMouseLeave` on the `<video>` via a ref) — this makes sense again now that the media is a persistent layer being uncovered by the flip, whereas in the two-face version hovering flipped the video away rather than toward the viewer.
- `.card` regained `overflow: hidden` and its border (moved back from the individual faces, since there's now only one physical box being clipped, not two rotating panels).
- `prefers-reduced-motion` now targets `.card-text-flip`'s transition (still instant flip on hover/focus, no animated swoop).

**Education:** In a `preserve-3d` flip, *what* floats above *what* during the animation is determined by which element is doing the rotating and which is static beneath it at a higher/lower z-index — not by which face happens to be "front" in the rotation. Swapping which content sits on which face of one rotating pair changes what ends up on top *after* the flip, but doesn't change how the animation reads *during* the flip; that required restructuring which element owns the rotation.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `Card.jsx` (no errors); confirmed no leftover `card-face`/`card-flip` class references in `src/`. Still no visual browser check this session — worth confirming the lid-flip reads clearly as "text floating above, media revealed beneath" rather than looking like a glitch, and that restored video autoplay-on-hover feels right timed against the flip.

---

## Session: Site stripped to TouchDesigner-only; full version saved as a template; first real clip live

**Title:** Saved the current multi-section site as a reusable template, trimmed the live site down to just the TouchDesigner section (more sections coming back later once UX/app work is ready), rebuilt that section as an asymmetric bento grid, and shipped the first real compressed clip.

**Template backup:**
- Copied the entire `portfolio/` project (minus `node_modules`) to `C:\Users\aznkr\Documents\Portfolio\portfolio-template\` via `robocopy` before making any destructive changes, so the UI/UX, 3D, and Featured Builds sections aren't lost — they can be pulled back out of the template when that work is ready.

**Site trimmed (`src/App.jsx`, `src/projects.js`):**
- Removed the UI/UX, 3D, and Featured Builds sections and their `uiProjects`/`threeProjects`/`featuredProjects` exports entirely (not just hidden — deleted, since the template copy preserves them).
- `NAV_LINKS` trimmed to just TouchDesigner + Contact, so there are no dead anchor links to removed sections.
- TouchDesigner section renumbered from `04` to `01` (it's the only/first section now).
- Left the hero copy ("triage dashboards to anatomical explainers...") as-is rather than rewriting it unasked — it currently still references the now-hidden UI/3D work, worth revisiting once the messaging is finalized.

**Real bug fixed in `projects.js`:** the `tdProjects` video/poster paths were hardcoded with a leading slash (`/videos/clip01.mp4`) instead of being prefixed with `BASE_URL` like the screenshot images already were. That works fine in local dev (served from `/`) but would have 404'd on GitHub Pages once deployed (served from `/portfolio/`). Fixed to `${BASE}videos/...` / `${BASE}posters/...`, matching the convention the comment at the top of the file already described but the TD entries hadn't actually followed.

**First real asset shipped:** `D:\TouchDesigner\Canvas Series\5 - Nvidia Wave Gravity\FlexGHPages.mov` (user's own 10s trim, 727×1280, mpeg4, 13.2MB, 60fps/11Mbps) compressed via `ffmpeg` (`fps=30`, even-dimension scale fix, `libx264 -crf 22 -preset slow`, no audio, faststart) → **2.8MB**, encoded in under 2 seconds. Extracted a poster frame at the 2s mark → 44KB. Both placed at `public/videos/clip01.mp4` / `public/posters/clip01.jpg`, and `tdProjects[0]` updated with real title/tag/desc ("Wave Gravity" — NVIDIA FleX-driven particle wave sim, inferred from the folder/file naming; worth the user confirming the copy is accurate). Verified both URLs return 200 through the dev server at their `BASE_URL`-prefixed paths. Clips 02/03 stay as gradient-placeholder cards (no `video` key yet) until real clips are ready — deliberately not pointed at nonexistent files, which would've rendered as broken/blank video elements.

**Bento layout (`src/index.css`):** new `.grid-bento` modifier on the existing `.grid` — `grid-template-columns: 1.3fr 1fr`, and `.grid-bento .card:first-child` spans both rows (`grid-row: 1 / span 2`) with `aspect-ratio: auto` so it stretches to match the combined height of the two stacked cards on the right, rather than fighting that height with its own 4:3 ratio. Row heights come from the two right-column cards' own `aspect-ratio: 4/3` (no explicit height set on `.grid` itself, so `grid-auto-rows: 1fr` resolves off content, not a fixed track size). Collapses to a single column below 640px, restoring the first card's own aspect-ratio there since there's no second column to size it against. This happens to suit the real clip well — 727×1280 is portrait, and the tall bento slot fits that far better than the uniform 4:3 grid would have.

**Education:** `grid-row: 1 / span 2` combined with `aspect-ratio: auto` (removing the item's own intrinsic-ratio height) is what lets a spanning grid item stretch to match tracks sized by its siblings' content — without dropping `aspect-ratio`, the spanning card would keep fighting its own 4:3 height against the row span instead of filling it.

**Notes:** Verified via `npm run dev` (HTTP 200), `npx oxlint` on changed files (no errors), and confirmed `videos/clip01.mp4` + `posters/clip01.jpg` both return HTTP 200 at their real `BASE_URL`-prefixed dev-server paths. No visual browser check this session (`claude-in-chrome` not connected) — worth confirming the bento proportions and portrait-video crop look right, and that the hero copy mismatch (still referencing UI/3D work) doesn't bother the user before it ships.

---

## Session: Bento crop fix, play button moved to the text layer, contact CTA relocated to the sidebar

**Title:** Three quick follow-ups: stopped the bento's tall card from cropping the portrait video, made the video-card play button live on the text layer (so it hides/shows with the flip instead of the media), and moved "Let's build something" from the footer into the sidebar as a green, email-free line.

**Bento crop fix (`src/index.css`):** the right-column cards were `aspect-ratio: 4/3` (landscape), which made the row-span too short for the actual clip's portrait ratio (727×1280) — `object-fit: cover` was cropping the top/bottom off. Changed the right cards to `aspect-ratio: 4/5` (taller, so the left card's matching row-span grows too — this is the "taller card" the user asked for), and added `object-fit: contain` specifically on the bento's first card as a hard backstop so nothing crops even if a future clip's ratio doesn't line up exactly with the row-span math. Mobile (≤640px, single column) first-card ratio changed from `4/3` to `3/4` for the same reason.

**Play button relocated (`src/Card.jsx`, `src/index.css`):** moved `<span className="play-badge">` out of `.thumb-video` (the static media layer) and into `.card-text-flip` (the layer that actually rotates on hover/focus) — it's a sibling of `.card-text-float` now, not nested inside the video thumb. Since it now lives on the *same rotating element* as the text, hovering makes both disappear together automatically (no extra JS/CSS hover-state needed beyond the existing flip) and un-hovering brings both back together. Restyled as a smaller (40px), more transparent (`rgba(255,255,255,0.55)` + `backdrop-filter: blur(4px)`) corner badge (top-right) instead of a dead-center circle, so it overlays the text panel without sitting on top of the title/description. Removed the now-contradictory `.card.is-clickable:hover .play-badge { scale... }` rule — it existed to grow the badge when hovering revealed it; now hovering *hides* it, so that rule no longer made sense.

**Contact CTA moved (`src/App.jsx`, `src/index.css`):** `<h3>Let's build something.<br/><a href="mailto:...">...</a></h3>` removed from the footer entirely (footer now just keeps the copyright/meta line). New `<p className="sidebar-cta">Let's build something.</p>` added inside `.profile-panel`, after `<LeafSprout />` — plain text, no email address, no link, styled in `--accent` green.

**Notes:** Verified via `npm run dev` (HTTP 200), `npx oxlint` on `Card.jsx`/`App.jsx` (no errors). No visual browser check this session — worth confirming the corner play-badge placement doesn't collide with the card-text-float panel's own corner, and that the bento's portrait fit looks right without cropping now.

---

## Session: Bento grid — two broken attempts at exact sizing, then a working fix; made the layout repeatable

**Title:** User wanted exact, tunable numbers to eliminate gray letterbox bars on the bento's left card. Two CSS attempts broke the whole layout before landing on something stable — documenting both failures since they're genuinely useful "don't do this" cases.

**Attempt 1 — `grid-template-columns: auto 1fr` with `aspect-ratio` on the spanning card:** the idea was to let column 1's width be *derived* from the row-span height × the clip's real aspect ratio, for a pixel-exact fit. This has a circular dependency: column 1's width needs the row heights, which come from column 2's cards, which need column 1's width first. Browsers don't reliably resolve that for a spanning item that also carries `aspect-ratio` — it collapsed column 2, and Clips 02/03 disappeared entirely.

**Attempt 2 — fixed the circularity by going back to plain `fr` columns, but computed the fr proportion live via `calc()` with nested `var()` division:** `calc(2 * (var(--td-clip-w) / var(--td-clip-h)) / (var(--td-side-w) / var(--td-side-h)) * 1fr)`. This is spec-legal in principle, but proved too fragile in practice — the whole `grid-template-columns` declaration got dropped as invalid, and an invalid grid-template-columns falls back to default single-column auto-placement, which is why the user saw "3 huge cards stacked on top" instead of a bento.

**Working fix:** dropped calc()-driven column widths entirely. `grid-template-columns` is now a plain literal number (`1.42fr 1fr`), hand-computed once from the same formula (documented in a comment: `2 × (clip w/h) / (side w/h)`) rather than live. `aspect-ratio` on the cards still uses CSS custom properties (`--td-side-ratio`) since that's simple `var()` token substitution with no `calc()`/division involved — that part was never actually broken, only the grid-template-columns calc() was.

**Made the bento repeatable (`src/App.jsx`):** per the user's note that more bento blocks are coming, restructured from one grid that only special-cased its first child to a `chunk3()` helper that groups `tdProjects` into 3s and renders one independent `.grid.grid-bento` per group. A 4th/5th/6th clip now starts a fresh, correctly-aligned bento block underneath instead of trying to auto-place into the first block's leftover grid cells. `.grid-bento + .grid-bento { margin-top: 18px }` spaces stacked blocks evenly.

**Education:** `calc()` inside `grid-template-columns` supports `var()` and mixed units in principle, but nested division chains are exactly the kind of thing that's fragile across real browser implementations — when a grid layout goes from "looks a bit off" to "collapsed entirely," an invalid/dropped declaration falling back to the property's initial value (`none`, i.e. single implicit column) is the first thing to suspect, especially right after introducing a complex calc() expression.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `App.jsx` (no errors). Still no visual browser check this session (`claude-in-chrome` not connected) — this is the third bento-sizing iteration without visual confirmation, so it's worth an actual look before trusting the numbers are right; the literal `1.42fr` is unambiguously valid CSS at least, which the two broken attempts were not.

---

## Session: Third bento card shape (wide/full-row) — layout became data-driven instead of positional

**Title:** User has a landscape clip meant to span a full row on its own — a third shape the position-only `chunk3()` grouping (every 1st-of-3 = tall, rest = square) had no way to express. Replaced positional chunking with a `layout` tag per clip.

**`src/projects.js`:** every `tdProjects` entry now carries a `layout: 'tall' | 'square' | 'wide'` field (documented at the top of the file) instead of relying on its position within a group of 3. `'wide'` breaks a clip out of the 3-card grouping entirely into its own full-width row. Left a commented-out example entry showing where to drop in the wide clip once it's compressed.

**`src/App.jsx`:** `chunk3()` replaced with `groupForBento()` — walks `tdProjects` in order; any `'wide'`-tagged clip immediately flushes whatever's pending and becomes its own single-item `{ type: 'wide' }` block; everything else queues up and flushes as a 3-card `{ type: 'trio' }` block once it hits 3. This also incidentally fixes the earlier "10 clips leaves 1 orphaned" problem from a few messages back: a run that doesn't reach 3 now flushes as `{ type: 'plain' }` — rendered as an ordinary uniform-grid card instead of a lone tall slot with an empty gap beside it.

**`src/index.css`:** new `.grid-bento-wide .card { aspect-ratio: 21/9; }` for the full-width banner shape (reuses the base `.grid`'s existing auto-fill column, which already gives a lone item the full row width — only the card's own aspect-ratio needed overriding). Replaced the narrower `.grid-bento + .grid-bento { margin-top: 18px }` with `#td .grid + .grid { margin-top: 18px }` so the spacing is consistent between *any* two stacked TD blocks now, not just bento-to-bento.

**Education:** Positional grouping (`chunk3`, "every 1st item of every 3 is special") works only as long as every group is structurally identical. The moment one item needs to *opt out* of the pattern entirely (a full-width clip, not just a different corner of the same 3-card shape), the grouping logic has to become data-driven — asking each item what it is, rather than inferring it from array position.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on `App.jsx`/`projects.js` (no errors). Still no visual browser check this session — worth confirming the wide block's `21/9` ratio reads as intended once a real wide clip is dropped in with `layout: 'wide'`.
