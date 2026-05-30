# Stream Deck Claude Meter

A real-time Claude API token usage meter for your Elgato Stream Deck. Animates as Claude thinks, fills as context grows, and resets cleanly between sessions — all driven by Claude Code's hook system.

![Claude Meter demo](com.mishigo.claude-meter.sdPlugin/icons/action.png)

---

## What it does

| State | Visual | Trigger |
|---|---|---|
| **Thinking** | Red snake animates through the grid | Before each tool call |
| **In use** | Grid fills with token count | After each tool call |
| **Idle** | Grid pulses gently | No active session |
| **Press key** | Resets to zero | Manual reset |

The fill level represents how much of Claude's context window you've consumed (default cap: 200k tokens).

---

## Requirements

- [Elgato Stream Deck](https://www.elgato.com/stream-deck) hardware
- [Stream Deck software](https://www.elgato.com/downloads) 6.4+
- [Claude Code](https://claude.ai/code) CLI
- Node.js 20+ (for building; Stream Deck ships its own runtime)
- bash + Python 3 (for hooks — standard on macOS, available via Git Bash on Windows)

---

## Installation

### 1. Clone and build

```bash
git clone https://github.com/mishigo-co/claude-code-meter-for-stream-deck
cd streamdeck-claude-meter
npm install
npm run build
```

### 2. Link the plugin to Stream Deck

```bash
npx streamdeck link com.mishigo.claude-meter.sdPlugin
npx streamdeck dev   # enables developer mode (one-time)
```

Then restart the Stream Deck app. The **Claude Meter** action will appear in your actions list — drag it onto a key.

### 3. Wire up the hooks

Add the following to your `~/.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash /path/to/streamdeck-claude-meter/hooks/pre-tool-use.sh" }]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "",
        "hooks": [{ "type": "command", "command": "bash /path/to/streamdeck-claude-meter/hooks/post-tool-use.sh" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "bash /path/to/streamdeck-claude-meter/hooks/stop.sh" }]
      }
    ]
  }
}
```

Replace `/path/to/streamdeck-claude-meter` with your actual clone path. Restart Claude Code for hooks to take effect.

---

## How it works

```
Claude Code lifecycle hooks
         │
         ▼
  HTTP POST → localhost:3141/update
         │
         ▼
  Plugin HTTP server (server.ts)
         │
         ▼
  ClaudeMeterAction state update
         │
         ▼
  50ms tick → renderFrame() → setImage()
         │
         ▼
  Stream Deck key display
```

Three hooks drive the meter:

- **`pre-tool-use.sh`** — Fires before every tool call. Sends `{ isThinking: true }` → starts the snake animation.
- **`post-tool-use.sh`** — Fires after every tool call. Parses the token count from stdin and sends `{ tokens: N }` → fills the grid.
- **`stop.sh`** — Fires on session end or `/clear`. Sends the final token count or resets to idle.

The plugin runs a lightweight HTTP server on `127.0.0.1:3141`. The hooks are the only clients — nothing is sent to any external service.

---

## Development

```bash
npm run watch        # rebuild on file changes
npx streamdeck restart com.mishigo.claude-meter   # restart plugin after rebuild
```

### Customisation

**Color scheme** — edit the constants at the top of `src/utils/render.ts`:

```typescript
const FILL     = "#CC0000";   // main fill color
const FILL_TIP = "#FF3333";   // leading edge
const EMPTY    = "#222222";   // unfilled blocks
const BG       = "#000000";   // background
```

**Animation speed** — in `src/utils/render.ts`, change the phase increment:

```typescript
this.phase = (this.phase + 0.02) % 1;  // smaller = slower
```

**Token cap** — set `maxTokens` per-key in the Stream Deck UI (default: 200,000).

**Grid size** — change `COLS` and `ROWS` in `render.ts` (currently 4×5 = 20 blocks).

---

## Project structure

```
streamdeck-claude-meter/
├── src/
│   ├── plugin.ts              # entry point — registers action, starts server
│   ├── server.ts              # HTTP server on :3141
│   ├── actions/
│   │   └── claude-meter.ts    # Stream Deck action, 50ms animation tick
│   └── utils/
│       ├── render.ts          # SVG frame renderer
│       └── frames.ts          # GIF frame loader (for future use)
├── hooks/
│   ├── pre-tool-use.sh        # fires before each tool call
│   ├── post-tool-use.sh       # fires after each tool call
│   └── stop.sh                # fires on session end
├── com.mishigo.claude-meter.sdPlugin/
│   ├── manifest.json          # Stream Deck plugin manifest
│   ├── bin/plugin.js          # compiled bundle (generated)
│   └── icons/                 # key icons and GIF assets
├── tsup.config.ts
└── tsconfig.json
```

---

## Troubleshooting

**Plugin doesn't appear in Stream Deck**
- Run `npx streamdeck validate com.mishigo.claude-meter.sdPlugin` and fix any errors
- Restart Stream Deck after linking

**Animation doesn't start**
- Check the server is running: `curl http://127.0.0.1:3141/health`
- Check Stream Deck logs: `%APPDATA%\Elgato\StreamDeck\logs\StreamDeck.log`
- Make sure you restarted Claude Code after editing `settings.json`

**Token count not showing**
- Verify Python 3 is available: `python3 --version`
- On Windows, confirm Git Bash is installed and `bash` is in PATH

**Hooks not firing**
- Confirm hooks are in `~/.claude/settings.json` (global), not a project-level file
- Check hook paths use forward slashes, even on Windows

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

Built by [Ali Elgin](https://github.com/mishigo-co) · Powered by the [Elgato Stream Deck SDK](https://developer.elgato.com/documentation/stream-deck/sdk/overview/)
