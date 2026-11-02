# projects.js: educational companion

**File:** `src/projects.js`
**Role:** the single data file that describes every TouchDesigner piece on the home page. Components read it, so editing data here changes the page without touching React code.

## ELI5

Think of this file as a shelf list. Each piece has a card in the binder: its name, its video, its colours. Then a second list says which cards go on which page spread. Adding a piece means writing one new card, then putting it on a spread.

## Structure

| Section | What it does |
|---|---|
| Header comment | Step-by-step guide for adding a piece |
| `const BASE` | The Vite base path, so asset URLs work on GitHub Pages |
| `const clipNN = {...}` | One object per video piece: title, tag, desc, video, poster, grad |
| `const gallery`, `const audioReactivity` | Special cards: a still image, and a text-only statement card |
| `export const tdProjects` | Flat list of every piece. Only used for the "N clips" count |
| `export const tdLayout` | Ordered rows. Each row names its type and the items in it |

## Field reference

- **title:** shown on the card and in the lightbox. Keep it short.
- **tag:** small category label. The current pieces use `TouchDesigner`.
- **desc:** one or two plain sentences. Avoid em dashes (site rule).
- **video / poster:** built with the `${BASE}` prefix. Without it the file 404s on GitHub Pages while working fine locally.
- **initial:** one letter shown on the gradient face when no poster loads.
- **grad:** two hex colours for that gradient face.
- **plain:** no text box and no hover chrome. Autoplay only. Clips 04, 05, and 07 use it, so their labels exist in code but do not show on the page.
- **static:** keeps text always visible instead of hover-to-reveal.

## Layout rules

`tdLayout` rows must match their type:

- `wide`: one item, full width, video only. Its text never renders, so `Gallery View` style labels on a wide item are for the code only.
- `trio` and `trio-reverse`: exactly three items. Index 0 is the tall slot in `trio`, and the tall slot is index 2 in `trio-reverse`.
- `cropHero: true`: crops a tall slot with `object-fit: cover`. Use it when a hero image's shape does not match the slot.

## Why it is built this way

- **Data in a plain file, not in components.** The author can add work without understanding React. The same pattern keeps the Lightbox and Card reusable.
- **Explicit row composition.** The rows are hand-curated, not auto-grouped by tag, so the page keeps a deliberate composition. The header comment says so.
- **`BASE` from `import.meta.env`.** Vite replaces it at build time, so local dev and the Pages build both resolve paths correctly.

## Potential pitfalls

- A row with the wrong item count renders a broken or empty bento slot. Count items before saving.
- A hardcoded `/videos/...` path works in `npm run dev` and 404s on GitHub Pages.
- Setting `plain: true` by accident hides the title and description on screen.
- `tdProjects` must include every new piece, or the "N clips" count is wrong. The layout is separate and does not update the count.

## Best practices

- Copy an existing block rather than writing one from scratch. The field names must match exactly.
- Run `npm run dev` and check the new card before pushing.
- Ship through a feature branch and a PR, not a direct push to `main`.

## Notes

- Clip 08 sits in the `wide` row. Its label is data only, so visitors see the video with no text, as before.
- The four labels added in this change (Black Glossy, Faceted Tiles, Ridge Study, Gallery View) come from the poster frames and were confirmed by the owner.
