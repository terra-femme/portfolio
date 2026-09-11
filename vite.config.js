import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'

// package.json sets "type": "module", so this config is ESM and __dirname does
// not exist here. Resolve entry points against import.meta.url instead.
const entry = (file) => fileURLToPath(new URL(file, import.meta.url))

// IMPORTANT: set base to '/<your-repo-name>/' for GitHub Pages project sites.
// If you deploy to a user/org page (username.github.io repo), use '/'.
export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
  build: {
    rollupOptions: {
      // Two real HTML documents rather than one SPA with client-side routes.
      // GitHub Pages serves static files with no rewrite rules, so an SPA route
      // like /portfolio/dashboard would 404 on refresh or on a shared link.
      // Separate entries also mean a visitor who never opens the dashboard
      // never downloads its bundle.
      input: {
        main: entry('./index.html'),
        dashboard: entry('./dashboard.html'),
      },
    },
  },
})
