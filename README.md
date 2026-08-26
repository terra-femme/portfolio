# Terra Femme — TouchDesigner Reel

**Live: [terra-femme.github.io/portfolio](https://terra-femme.github.io/portfolio/)**

Real-time particle simulation, generative systems and audio-reactive visual work,
composed into a bento layout. Cards autoplay a muted preview on hover and expand
to a full player on click.

## In the reel

| Piece | |
|---|---|
| **Wave Gravity** | NVIDIA FleX-driven particle wave simulation, gravity-warped, rendered in real time |
| **Flectics** | monochromatic contrast study — a black-and-white web with flecks |
| **Holochromatic** | holographic vinyl cover treatments |
| **RayTK in TouchDesigner** | raymarching via RayTK, split-screen |
| **Gallery Presentation** | installation / gallery context |
| **Live Performance** | audio-reactive visuals driven live |

## Stack

Vite + React Three Fiber. Subtle 3D background behind the grid, scramble-text
navigation, lightbox player. Auto-deploys to GitHub Pages on every push to `main`.

---

## Maintaining

### Run locally

```bash
npm install
npm run dev
```

### Adding a clip

1. Compress to web-friendly MP4 (H.264). ~1080p at 2–4 Mbps keeps a sub-3-minute
   clip well under GitHub's 100 MB/file limit:

   ```bash
   ffmpeg -i input.mov -vcodec libx264 -crf 24 -preset slow -an -movflags +faststart clip01.mp4
   ```

   `-an` drops audio (remove to keep it). `+faststart` lets playback begin before
   the file finishes downloading.

2. Put it in `public/videos/`.

3. Save a still frame in `public/posters/` so the card shows an image before the
   video loads:

   ```bash
   ffmpeg -i clip01.mp4 -vframes 1 -q:v 3 posters/clip01.jpg
   ```

4. Add the entry in `src/projects.js`, then compose it into a row in `tdLayout`.

> **Gotcha:** public asset paths must be prefixed with `BASE_URL`, because
> `vite.config.js` sets `base: '/portfolio/'` for GitHub Pages. A hardcoded
> leading slash resolves to the domain root and 404s once deployed — and it works
> fine in local dev either way, so it's easy to ship broken.

If total video weight approaches ~1 GB, host the heavy clips on Vimeo/YouTube and
embed, keeping only light previews in the repo.

### Where things live

- Colors and fonts — CSS variables at the top of `src/index.css`
- 3D background — `src/Background3D.jsx`
- Name, email, nav — `src/App.jsx`
- Cards and lightbox — `src/Card.jsx`, `src/Lightbox.jsx`

### Deploy

Pushing to `main` rebuilds and publishes automatically via GitHub Actions
(**Settings → Pages → Source: GitHub Actions**).
