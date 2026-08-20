# Changelog — 2026-08-18

## Session: Nav link scramble animation

**Title:** Added letter-scramble effect to top nav links, with hover highlight retained.

**Fix:**
- New `src/ScrambleLink.jsx` — wraps nav link text in per-character `<span>`s. Every 3s picks one random non-space letter in the label and cycles it through random alphanumeric characters for ~240ms before resolving back to the original character. Skips entirely under `prefers-reduced-motion: reduce`. `aria-label` on the `<a>` keeps the accessible name stable while the visual spans are `aria-hidden`.
- `src/App.jsx` — swapped the five nav `<a>` tags for `<ScrambleLink>`.
- `src/index.css` — added `transition: color 0.25s` to `.nav .links a` so the existing `:hover` highlight (`color: var(--ink)`) eases in instead of snapping.

**Education:** Classic "text scramble" hover effect, scoped down to a single letter per tick instead of scrambling the whole word, driven by a `setInterval` + chained `setTimeout` frame loop and React state per character.

**Best Practices:** Respected `prefers-reduced-motion`; preserved the accessible name via `aria-label` + `aria-hidden` so screen readers don't read garbled interim characters.

**Notes:** Verified via `npm run dev` (served clean at `http://localhost:5173/portfolio/`, HTTP 200) and `npx oxlint` on both changed files (no errors). Could not visually screenshot — Chrome extension (`claude-in-chrome`) wasn't connected this session.

---

## Session: Nav scramble iteration — one link at a time, 3D bubble, glow, hero word, responsive fix

**Title:** Iterated on the scramble effect (single-link cycling, 3D letter bubble, glow variant on the hero word) and fixed a real horizontal-overflow bug in the responsive layout.

**Fix:**
- Replaced `ScrambleLink.jsx` with `src/ScrambleNav.jsx` — instead of every nav link running its own independent 3s timer (so they all scrambled together), a single shared cycle now advances through the links one at a time; a hover/focus sweep runs through every letter of just that link, left to right, and is guarded against colliding with the passive cycle via a `busyRef` set.
- Added a CSS 3D "bubble" to each scrambling letter (`src/index.css`): `@keyframes letter-bubble` lifts, scales, and `rotateX`-tilts the letter with a back-ease-out (`cubic-bezier(0.34,1.56,0.64,1)`) overshoot, using `perspective` on the word wrapper for real depth. Each scramble fires a version-keyed "pulse" so the letter's `<span>` remounts and replays the animation, with `animationDuration` set to match that letter's actual scramble duration.
- New `src/ScrambleWord.jsx` — same bubble/scramble mechanic scoped to a single inline word, plus a glowing variant (`letter-bubble-glow` keyframes, green `text-shadow` bloom at the peak). Wired onto "dimensional" in the hero (`<ScrambleWord as="em" text="dimensional" />` in `App.jsx`), which also got a faint permanent ambient glow (`.hero h1 em`) so it reads as glowing at rest, not just mid-pulse.
- Decoupled `ScrambleWord`'s idle timer from the nav's fixed 3s interval — it now reschedules itself with a randomized 4.2–7s delay each cycle instead of `setInterval(3000)`, so the hero word and nav links drift out of phase instead of pulsing in lockstep.
- **Responsive layout bug fix:** diagnosed a classic CSS Grid/Flexbox "min-width: auto" blowout. `.page-container`'s `1fr` column (`.frames`) and other flex rows (`.section-head`, `.footer`) were refusing to shrink below the intrinsic content width of their largest text (the hero `<h1>`, section `<h2>`, footer `<h3>`) because grid/flex children default to `min-width: auto`. The overflow was being silently clipped by `overflow-x: hidden` on `body`, so nothing visibly reflowed until a `@media` breakpoint (900px / 640px) restructured the layout — hence "cuts the screen, then suddenly scales down" instead of smooth resizing. Fixed by adding `min-width: 0` to `.page-container > *`, `.section-head h2`, and `.footer h3`, plus `overflow-wrap: break-word` on the hero `h1`, section `h2`, and footer `h3` as a safety net; also made `.section-head` wrap (`flex-wrap: wrap`) for narrow widths.

**Education:** Flex/grid items have an implicit `min-width: auto` (and `min-height: auto` for rows), which means they won't shrink below their content's min-content size unless you override it — this is the #1 cause of "my responsive layout overflows instead of reflowing" bugs. `overflow-x: hidden` on `body` masks the symptom (clipping) without fixing the cause, which is why it looked like nothing was happening until a breakpoint hit.

**Best Practices:** Diagnosed from the actual CSS/DOM structure (grid-template-columns, flex containers, font-size clamps) rather than guessing; kept the fix scoped to the specific containers with large/unbreakable text instead of blanket-applying `min-width: 0` everywhere.

**Notes:** Verified via `npm run dev` (HTTP 200) and `npx oxlint` on all changed `.jsx` files (no errors) each iteration. Still no visual browser verification this session — `claude-in-chrome` extension not connected — recommend the user manually drag-resize to confirm the fix reads as smooth end to end.
