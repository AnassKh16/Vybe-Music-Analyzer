// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { nitro } from "nitro/vite";

export default defineConfig({
  // Vercel deployment:
  // - Disable Cloudflare worker build plugin (it produces `wrangler.json` + worker entry)
  // - Enable Nitro's Vercel preset so the SSR output matches Vercel runtime
  cloudflare: false,
  plugins: [nitro({ preset: "vercel" })],
  vite: {
    server: {
      // Leading dot = allow that host + all subdomains (Vite 5+). Needed for
      // localtunnel (e.g. *.loca.lt), Cloudflare quick tunnels, ngrok, etc.
      allowedHosts: [".loca.lt", ".trycloudflare.com", ".ngrok-free.app", ".ngrok.io"],
    },
  },
});
