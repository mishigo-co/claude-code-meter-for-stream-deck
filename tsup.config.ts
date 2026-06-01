import { defineConfig } from "tsup";

const PLUGIN = "com.mishigo.context-meter.sdPlugin";

export default defineConfig([
  // Plugin process (Node).
  {
    entry: ["src/plugin.ts"],
    outDir: `${PLUGIN}/bin`,
    format: ["cjs"],
    bundle: true,
    platform: "node",
    target: "node20",
    noExternal: [/.*/],
    clean: true,
    outExtension: () => ({ js: ".js" }),
  },
  // Property inspector (browser). Bundles the @elgato/streamdeck browser SDK.
  {
    entry: { inspector: "src/ui/inspector.ts" },
    outDir: `${PLUGIN}/ui`,
    format: ["esm"],
    bundle: true,
    platform: "browser",
    target: "es2022",
    noExternal: [/.*/],
    clean: false, // keep inspector.html, which is a committed static asset
    outExtension: () => ({ js: ".js" }),
  },
]);
