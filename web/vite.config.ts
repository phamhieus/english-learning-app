import { spawn, type ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

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
  plugins: [react(), tailwindcss(), cloudflare(), localAiHelper()],
})
