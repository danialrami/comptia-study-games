/// <reference types="vitest/config" />
import { defineConfig } from "vitest/config";

// Zero-framework static site. Each game is an ES module lazy-mounted by the
// dashboard shell; the build is a plain static bundle servable from any host
// (GitHub Pages, Cloudflare Pages, or siku).
export default defineConfig({
  base: "./",
  build: {
    outDir: "dist",
    target: "es2020",
  },
  test: {
    // Engine tests are pure and DOM-free — run them in the fast node env.
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
