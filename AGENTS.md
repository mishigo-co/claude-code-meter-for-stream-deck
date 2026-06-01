# AGENTS.md

Stream Deck plugin (Node, TypeScript). The README covers setup, hooks, and architecture — read it. This file lists only things you can't infer from the repo.

## Landmines

- **`setImage` only animates SVG data URLs.** GIF data URLs render the first frame only; PNG data URLs cycled via `setInterval` don't update the display at all (the interval fires, `setTitle` works, the image just freezes). Every animation must be emitted as `data:image/svg+xml;base64,...`. Don't reach for a GIF/PNG-frame approach (e.g. `omggif`) expecting animation — it won't update.
- **`@action` decorator key is `UUID` (uppercase).** Lowercase `uuid` silently leaves `manifestId` undefined and `registerAction` throws at startup.
- **`manifest.json` silent-failure fields:** `Nodejs.Version: "20"` is mandatory — without it Stream Deck never launches the plugin process and gives no error. `Version` must be 4-part (`1.0.0.0`). `CategoryIcon` is required whenever `Category` is set. `OS` is required.

## Renderer & characters

The animation is rendered as SVG in `src/utils/renderCharacter.ts` (face expressions + motion, shared by all characters). The body silhouette and palette come from a data-driven **character pack** in `src/utils/characters.ts`. Packs supply only `base` (12×12 grid) + `palette`; eyes/mouth/motion stay procedural — keep that split. The `claude` pack there must stay pixel-identical to the original hand-coded body (it's derived from the old `drawBase`); the smoke-test approach in the build section guards this.

## Build / typecheck / reload

- `npm run build` runs **two** tsup builds: the Node plugin → `bin/plugin.js`, and the browser property inspector (`src/ui/inspector.ts` → `ui/inspector.js`). The plugin build has `clean: true`; the PI build has `clean: false` so it doesn't wipe the committed `ui/inspector.html`. Generated `bin/` and `ui/inspector.js` are gitignored — never hand-edit.
- **`tsc --noEmit` is NOT a usable gate here.** The `@elgato/streamdeck` package has a dual `exports` map (`browser` + `default`); under `moduleResolution: NodeNext`, `tsc` resolves *every* file to the **browser** types, so the plugin's `SingletonAction`/`@action`/event imports all report "no exported member". esbuild (tsup) resolves correctly per `platform` (`node` for the plugin, `browser` for the PI) — it is the real build gate, but it strips types and never type-checks. To actually exercise pure logic (renderer + packs), bundle a throwaway entry with `npx esbuild <file> --bundle --platform=node` and run it.
- After a rebuild the running plugin keeps the old bundle. Run `npx streamdeck restart com.mishigo.claude-meter` to load changes.

## Hooks

The `Stop` hook must POST `{ "complete": true }` (not just a token count) so the server distinguishes session-end from a normal post-tool-use update. The PreToolUse/PostToolUse matchers are `""` (match all tools), and hooks live in **global** `~/.claude/settings.json`, not a project file.
