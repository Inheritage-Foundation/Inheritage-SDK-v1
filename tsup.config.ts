import { defineConfig } from "tsup"

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/langchain.ts",
    "src/hooks.ts",
    "src/components/InheritageCitation.tsx",
  ],
  format: ["esm", "cjs"],
  dts: true,
  outExtension({ format }) {
    return {
      js: format === "esm" ? ".mjs" : ".cjs",
    }
  },
  clean: true,
  sourcemap: false,
  treeshake: true,
})

