# 3D Portfolio

Vite + React Three Fiber portfolio with floating project cards over a subtle 3D background. Auto-deploys to GitHub Pages.

## Run locally
```bash
npm install
npm run dev
```

## Add your projects
Edit `src/projects.js`. Each entry becomes a card. To use real images instead of the
lettered placeholder, see the comment at the top of `src/Card.jsx`.

## Deploy to GitHub Pages (one-time setup)
1. Create a repo and push this folder to the `main` branch.
2. In `vite.config.js`, set `base` to `'/<your-repo-name>/'`
   (or `'/'` if the repo is named `<username>.github.io`).
3. On GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. Every push to `main` rebuilds and publishes automatically.

Your site will be at `https://<username>.github.io/<repo-name>/`.

## Customize
- Colors/fonts: CSS variables at the top of `src/index.css`
- Background 3D: `src/Background3D.jsx`
- Name / email / nav: `src/App.jsx`

## Adding TouchDesigner clips
1. Export/compress each clip as web-friendly MP4 (H.264). A good target is
   1080p, ~2–4 Mbps — a sub-3-min clip lands well under GitHub's 100 MB/file limit.
   Example with ffmpeg:
   ```bash
   ffmpeg -i input.mov -vcodec libx264 -crf 24 -preset slow -an -movflags +faststart clip01.mp4
   ```
   (`-an` drops audio; remove it to keep sound. `+faststart` lets the video start
   playing before it fully downloads.)
2. Put files in `public/videos/` (e.g. `public/videos/clip01.mp4`).
3. (Optional but recommended) Save a still frame per clip in `public/posters/`
   so the card shows an image before the video loads:
   ```bash
   ffmpeg -i clip01.mp4 -vframes 1 -q:v 3 posters/clip01.jpg
   ```
4. Edit `src/projects.js` → `tdProjects`: set `video`, `poster`, `title`, `desc`.

Cards auto-play a muted preview on hover and expand to a full player on click.
If total video size pushes the repo over ~1 GB, host the big clips on Vimeo/YouTube
and embed instead — keep only light previews in the repo.
