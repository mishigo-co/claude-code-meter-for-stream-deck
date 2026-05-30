import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/plugin.ts"],
  outDir: "com.mishigo.claude-meter.sdPlugin/bin",
  format: ["cjs"],
  bundle: true,
  platform: "node",
  target: "node20",
  noExternal: [/.*/],
  clean: true,
  outExtension: () => ({ js: ".js" }),
});
