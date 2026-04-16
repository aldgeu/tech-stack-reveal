// Static SPA build config — use this to self-host on any static web server
// (Nginx, Apache, S3, GitHub Pages, Netlify static, Cloudflare Pages static, etc.).
//
// Build:    npx vite build --config vite.config.static.ts
// Preview:  npx vite preview --config vite.config.static.ts
// Output:   ./dist  (upload these files to your host)
//
// This bypasses the TanStack Start SSR/Worker setup and produces a plain
// client-rendered SPA. You MUST configure your web server to fall back to
// index.html for unknown routes (SPA fallback) — see HOSTING.md.

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import path from "node:path";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
      routesDirectory: "src/routes",
      generatedRouteTree: "src/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  // Single index.html SPA entry — the file below mounts the TanStack router on the client.
});
