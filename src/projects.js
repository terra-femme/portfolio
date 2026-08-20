// Edit this file to add your work.
//
// Put clip files in:   public/videos/yourclip.mp4
// Optional poster in:  public/posters/yourclip.jpg  (still frame shown before the video loads)
//
// Public assets (videos, posters, screenshots) must be prefixed with BASE_URL
// because vite.config.js sets `base: '/portfolio/'` for GitHub Pages — a
// hardcoded leading slash resolves to the domain root instead, 404ing once
// deployed (works fine in local dev either way, so this is easy to miss).
const BASE = import.meta.env.BASE_URL;

// ---- TouchDesigner clips ----
// Individual pieces. `tdLayout` below composes these into rows — this
// list itself is just the raw media (used for the "N clips" count).
const clip01 = {
  title: 'Wave Gravity',
  tag: 'Flex Particles',
  desc: 'NVIDIA FleX-driven particle wave simulation — gravity-warped motion rendered in real time.',
  video: `${BASE}videos/clip01.mp4`,
  poster: `${BASE}posters/clip01.jpg`,
  initial: 'T',
  grad: ['#4fd6e0', '#7c5cff'],
};
const clip02 = {
  title: 'Flectics',
  tag: 'MonoChromatic',
  desc: 'Black and white contrasted web with flecks.',
  video: `${BASE}videos/clip02.mp4`,
  poster: `${BASE}posters/clip02.jpg`,
  initial: 'T',
  grad: ['#f2c14e', '#ef6f6c'],
};
const clip03 = {
  title: 'Holochromatic',
  tag: 'Viny Covers',
  desc: 'Holographic vinyl covers with a chromatic sheen.',
  video: `${BASE}videos/clip03.mp4`,
  poster: `${BASE}posters/clip03.jpg`,
  initial: 'T',
  grad: ['#7c5cff', '#ef6f6c'],
};
const clip04 = {
  title: 'Clip 04',
  tag: 'TouchDesigner',
  desc: 'Placeholder title/description — swap in the real ones.',
  video: `${BASE}videos/clip04.mp4`,
  poster: `${BASE}posters/clip04.jpg`,
  initial: 'T',
  grad: ['#22d3a6', '#2b5cff'],
  plain: true, // no text box — just autoplays
};
const clip05 = {
  title: 'Clip 05',
  tag: 'TouchDesigner',
  desc: 'Placeholder title/description — swap in the real ones.',
  video: `${BASE}videos/clip05.mp4`,
  poster: `${BASE}posters/clip05.jpg`,
  initial: 'T',
  grad: ['#2b5cff', '#7c5cff'],
  plain: true, // no text box — just autoplays
};
const clip06 = {
  title: 'RayTK in TouchDesigner',
  tag: 'Split Screen',
  desc: 'Integration of RayTK within TouchDesigner for real-time ray tracing.',
  video: `${BASE}videos/clip06.mp4`,
  poster: `${BASE}posters/clip06.jpg`,
  initial: 'T',
  grad: ['#7c5cff', '#4fd6e0'],
};
const clip07 = {
  title: 'Clip 07',
  tag: 'TouchDesigner',
  desc: 'Placeholder title/description — swap in the real ones.',
  video: `${BASE}videos/clip07.mp4`,
  poster: `${BASE}posters/clip07.jpg`,
  initial: 'T',
  grad: ['#4fd6e0', '#22d3a6'],
  plain: true, // no text box — just autoplays
};
const clip08 = {
  title: 'Clip 08',
  tag: 'TouchDesigner',
  desc: 'Placeholder title/description — swap in the real ones.',
  video: `${BASE}videos/clip08.mp4`,
  poster: `${BASE}posters/clip08.jpg`,
  initial: 'T',
  grad: ['#ef6f6c', '#f2c14e'],
};
const gallery = {
  title: 'Gallery Presentation',
  tag: 'TouchDesigner',
  desc: 'Presentation mockup — composited exhibit view, not an installed piece.',
  image: `${BASE}screenshots/gallery-mask.jpg`,
  initial: 'T',
  grad: ['#e0609e', '#7c5cff'],
  plain: true, // no text box — just the static image
};
// No video/image — falls back to Card.jsx's gradient+initial front face.
// `static: true` keeps the text always visible instead of hover-to-reveal
// — this card's whole point is the statement, not something to uncover.
const audioReactivity = {
  title: 'Live Performance',
  tag: 'TouchDesigner',
  desc: 'Audio-reactivity when in live performance.',
  initial: 'A',
  grad: ['#f2c14e', '#22d3a6'],
  static: true,
};

export const tdProjects = [clip01, clip02, clip03, clip04, clip05, clip06, clip07, clip08, gallery];

// ---- Bento row composition ----
// Hand-authored rows (not auto-grouped) — this is bespoke curation, not
// a repeating pattern, so it's composed explicitly rather than inferred
// from tags. Row types (see .grid-bento / .grid-bento-reverse /
// .grid-bento-wide in index.css):
//   'wide'         — one clip, full-width, no card chrome, autoplays on loop
//   'trio'         — 3 cards: [0] tall-left (spans both rows), [1]/[2] square-right stacked
//   'trio-reverse' — 3 cards: [0]/[1] square-left stacked, [2] tall-right (spans both rows)
// `cropHero: true` on a trio (either direction) makes its tall slot use
// object-fit: cover instead of contain — for a hero item whose real
// ratio doesn't match the portrait slot's shape (a square photo, say),
// cropping in beats a big letterbox gap.
export const tdLayout = [
  { type: 'wide', items: [clip08] },
  { type: 'trio', items: [clip01, clip03, clip04] },
  { type: 'trio-reverse', items: [clip06, audioReactivity, gallery], cropHero: true },
  { type: 'trio-reverse', items: [clip02, clip07, clip05], cropHero: true },
];
