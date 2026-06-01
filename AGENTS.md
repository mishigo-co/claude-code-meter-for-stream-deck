# AGENTS.md

Stream Deck plugin (Node, TypeScript). The README covers setup, hooks, and architecture — read it. This file lists only things you can't infer from the repo.

## Landmines

- **`setImage` only animates SVG data URLs.** GIF data URLs render the first frame only; PNG data URLs cycled via `setInterval` don't update the display at all (the interval fires, `setTitle` works, the image just freezes). Every animation must be emitted as `data:image/svg+xml;base64,...`. Don't reach for a GIF/PNG-frame approach (e.g. `omggif`) expecting animation — it won't update.
- **`@action` decorator key is `UUID` (uppercase).** Lowercase `uuid` silently leaves `manifestId` undefined and `registerAction` throws at startup.
- **`manifest.json` silent-failure fields:** `Nodejs.Version: "20"` is mandatory — without it Stream Deck never launches the plugin process and gives no error. `Version` must be 4-part (`1.0.0.0`). `CategoryIcon` is required whenever `Category` is set. `OS` is required.

## Renderer

The live animation is the pixel-art character in `src/utils/renderCharacter.ts` — that's what `src/actions/claude-meter.ts` imports. The README's "Customisation" section still points at a `render.ts` (color/speed/grid constants) that no longer exists — it is stale; edit `renderCharacter.ts` instead.

## Build / reload

- `npm run build` runs tsup with `clean: true`, wiping and rewriting `com.mishigo.claude-meter.sdPlugin/bin/`. That dir is gitignored and generated — never edit it by hand.
- After a rebuild the running plugin keeps the old bundle. Run `npx streamdeck restart com.mishigo.claude-meter` to load changes.

## Hooks

The `Stop` hook must POST `{ "complete": true }` (not just a token count) so the server distinguishes session-end from a normal post-tool-use update. The PreToolUse/PostToolUse matchers are `""` (match all tools), and hooks live in **global** `~/.claude/settings.json`, not a project file.
