import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: set base to '/<your-repo-name>/' for GitHub Pages project sites.
// If you deploy to a user/org page (username.github.io repo), use '/'.
export default defineConfig({
  plugins: [react()],
  base: '/portfolio/',
})
