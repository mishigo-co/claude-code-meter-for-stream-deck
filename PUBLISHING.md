# Publishing Roadmap — Elgato Marketplace

Goal: ship this plugin on the Elgato Marketplace. Maker account: **created**. The plugin is a valid
SDK plugin and passes `streamdeck validate` (2 cosmetic warnings remain). This doc tracks what's left.

## Key decision (made)

**Rebrand to a generic name.** "Claude" is Anthropic's trademark; using it as the product name +
mascot is the main review/IP risk. We will rename the product and position it as _"works with Claude
Code"_ (nominative use), not _being_ Claude.

- Proposed name: **Context Meter** · UUID: **`com.mishigo.context-meter`** (your domain) — confirm in Phase 1.
- Mascot: keep the pixel-art character but rename the default pack off "claude".

---

## Phase 1 — Rebrand (do first; everything references the name)

The rename surface (already scoped):

| Where                                         | Change                                                                |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `com.mishigo.claude-meter.sdPlugin/` (folder) | rename to `com.mishigo.<new>.sdPlugin`                                |
| `manifest.json`                               | `UUID`, action `UUID`, `Name`, `Category`                             |
| `src/actions/claude-meter.ts`                 | `@action({ UUID })`; optional file/class rename (`ClaudeMeterAction`) |
| `tsup.config.ts`                              | `PLUGIN` const (output folder)                                        |
| `src/plugin.ts`                               | import path if the action file is renamed                             |
| `src/utils/characters.ts`                     | rename the `claude` default pack id/name; keep it `BUNDLED[0]`        |
| `README.md`, `AGENTS.md`                      | name, UUID, paths, commands, demo image, structure                    |

- Hooks (`hooks/*.sh`) reference only `:3141` — **no change needed**.
- `package.json` name is private/cosmetic — optional.
- Repo/GitHub name is cosmetic — optional, separate from publishing.
- Changing the UUID resets any previously stored global settings (fine pre-release).

After renaming: rebuild, re-link, `streamdeck validate`, and re-run the pack smoke test.

## Phase 2 — Assets & icons

- **Remove dead assets**: delete `icons/claude-*.gif` (leftovers from the abandoned GIF approach).
- **`@2x` icons**: add `plugin@2x.png` (CategoryIcon) and `action@2x.png` to clear the validate
  warnings. True 2× art preferred over upscaling.
- **Listing art** (Maker portal, not the repo): key art / thumbnail, 1–3 screenshots, ideally a short
  demo GIF/video of the meter cycling through states.

## Phase 3 — Manifest & metadata

- Add a support/repo `URL`.
- Review `Category`, `Description`, `Author`; confirm 4-part `Version`, `SDKVersion`, and
  `Software.MinimumVersion`.
- Make the `OS` list match what you actually test (see Phase 4).

## Phase 4 — Quality & cross-platform

- You declare **Windows + macOS**. Build, link, wire hooks (`bash` + `python3`; Git Bash on Windows),
  and confirm all five states render and the character dropdown + import work on each. Drop an OS from
  the manifest if you can't verify it.
- Onboarding: the plugin needs Claude Code + manual `~/.claude/settings.json` hook edits. Tighten the
  setup docs; state plainly that nothing leaves `localhost:3141`.

**Status (2026-06-01):**

- macOS — all five states cycled via the live server; `streamdeck validate` clean. PI character dropdown + import test pending user click-through.
- Windows — not yet verified. Decide before submit: test, or drop `windows` from `manifest.json` OS list.
- Setup docs — tightened in `README.md` (Privacy section, "wire hooks" step rewritten, verify step, log-path fix).

## Phase 5 — Package & submit

- `npx streamdeck pack com.mishigo.<new>.sdPlugin` → `.streamDeckPlugin`. Final `validate` should be
  **0 warnings**. Install the packaged file on a clean machine to sanity-check.
- Submit via the Maker portal with listing assets; respond to review feedback.

---

## Open questions

- Final name + mascot name (Phase 1 confirm).

## Decisions

- **Free listing.** Confirmed 2026-06-01.
- **Repo renamed** to `mishigo-co/context-meter-for-stream-deck`. Confirmed 2026-06-01.

## Status

Tracked in the task list (`#6`–`#16`). Sequence: **6 → (7,8,9) → 10,11,13 → 14 → 15 → 12 → 16**.
