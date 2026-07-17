import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

// Dev-only: start the Local AI Helper alongside `npm run dev` so Installed AI
// detection works in a plain browser (the sandbox cannot scan the machine).
// The packaged Uno desktop app does not need it — the C# WebView2 bridge
// answers instead. If the port is already taken the helper just exits.
function localAiHelper(): Plugin {
  let child: ChildProcess | undefined
  return {
    name: 'local-ai-helper',
    apply: 'serve',
    configureServer() {
      const helperPath = fileURLToPath(new URL('../local-ai-helper/server.mjs', import.meta.url))
      child = spawn(process.execPath, [helperPath], { stdio: 'inherit' })
      child.on('error', () => { /* helper is optional in dev */ })
      const stop = () => child?.kill()
      process.once('exit', stop)
      process.once('SIGINT', stop)
      process.once('SIGTERM', stop)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Prompt the user before a new build takes over (see PwaReloadPrompt.tsx),
      // instead of refreshing silently.
      registerType: 'prompt',
      // We register the service worker ourselves in PwaReloadPrompt.tsx.
      injectRegister: false,
      // Extra static assets to precache (not matched by the default globs).
      includeAssets: ['favicon.svg', 'icon.svg', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        id: '/',
        name: 'Ovvie — AI English Coach',
        short_name: 'Ovvie',
        description:
          'Practice English speaking, writing, and picture description with AI feedback.',
        lang: 'en',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: '#6366f1',
        background_color: '#f8fafc',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'pwa-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        // Precache the app shell only. Big on-demand assets are excluded and
        // fetched/cached at runtime instead:
        //  - ort-wasm / ffmpeg wasm: multi-MB, loaded lazily for transcription/audio
        //  - transcription.worker-*.js: Whisper worker, only used for speaking
        //  - ffmpeg/: not even shipped to Cloudflare (see public/.assetsignore)
        globPatterns: ['**/*.{js,css,html,ico,png,svg,webmanifest,woff,woff2}'],
        globIgnores: ['**/ffmpeg/**', '**/*.wasm', '**/transcription.worker-*.js'],
        // Headroom above the ~4.3 MB main bundle so it stays precached.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // HashRouter: all navigations resolve to the app shell.
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
    cloudflare(),
    localAiHelper(),
  ],
})
