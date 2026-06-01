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
	// Property inspector (browser).
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
	// Standalone character-pack editor (browser; opened via file:// or GitHub Pages
	// from /docs). IIFE format so the HTML can load it with a plain <script> tag —
	// ES modules are blocked by Chrome's CORS policy on file:// URLs.
	{
		entry: { editor: "src/editor/main.ts" },
		outDir: "docs",
		format: ["iife"],
		bundle: true,
		platform: "browser",
		target: "es2022",
		noExternal: [/.*/],
		clean: false, // keep editor/index.html, which is a committed static asset
		outExtension: () => ({ js: ".js" }),
	},
]);
