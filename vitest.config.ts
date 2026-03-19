import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/hooks.test.ts"], // Skip until React testing setup is fixed
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
      thresholds: {
        global: {
          branches: 70,
          functions: 80,
          lines: 80,
          statements: 80,
        },
      },
    },
  },
})

