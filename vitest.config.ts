import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "node",
    // v4.0: unit tests only — api.test.ts is integration (needs server)
    include: ["src/**/*.test.ts"],
    exclude: ["node_modules/**", ".next/**", "youpi-extracted/**", "src/lib/zeropaye/__tests__/api.test.ts"],
    globals: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["src/lib/zeropaye/**/*.ts"],
      // v4.0: don't exclude workers — they should be tested too
      exclude: ["**/*.test.ts"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
