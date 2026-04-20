import { defineConfig } from "vitest/config";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";

export default defineConfig({
  plugins: [svelte(), crx({ manifest })],
  resolve: {
    conditions: ["browser"],
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
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
