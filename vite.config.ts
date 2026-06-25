import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import type { Plugin } from "vite";
import manifest from "./manifest.json";

// Emit the MV3 manifest into the build, pointing the service worker at its
// built output. Replaces @crxjs/vite-plugin (which pulled a vulnerable rollup).
function emitManifest(): Plugin {
  return {
    name: "emit-mv3-manifest",
    generateBundle() {
      const m = JSON.parse(JSON.stringify(manifest));
      m.background.service_worker = "background.js";
      this.emitFile({
        type: "asset",
        fileName: "manifest.json",
        source: JSON.stringify(m, null, 2),
      });
    },
  };
}

export default defineConfig({
  plugins: [svelte(), emitManifest()],
  resolve: {
    conditions: ["browser"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "src/popup/index.html",
        background: "src/background/index.ts",
      },
      output: {
        // Stable name for the service worker so the manifest can reference it;
        // everything else is content-hashed under assets/.
        entryFileNames: (chunk) =>
          chunk.name === "background" ? "background.js" : "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
  test: {
    setupFiles: ["./src/test-setup.ts"],
    environment: "jsdom",
    exclude: [
      "**/node_modules/**",
      "**/.claude/worktrees/**",
      "**/dist/**",
    ],
  },
});
