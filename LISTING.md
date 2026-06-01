# Marketplace Listing — draft copy

Paste-ready text for the Elgato Maker portal. Tweak to taste.

## Name

Context Meter

## Subtitle / tagline (short)

A live token & context meter for Claude Code, right on your Stream Deck.

## Short description (cards / search results)

Watch Claude Code work from your Stream Deck. An animated character reacts as Claude thinks,
generates, and finishes, while a bar fills to show how much of the context window you've used.

## Long description

**Context Meter** turns a Stream Deck key into a live status display for [Claude Code](https://claude.ai/code).

A little character reacts in real time as Claude Code works:

- **Thinking** — eyes up, bouncing dots, before each tool call
- **Generating** — mouth open, typing bars, with a running token count
- **Success** — wide eyes and sparkles when a turn finishes, then it dozes off
- **Idle / sleeping** — a gentle bob, then ZZZ when nothing's happening

A thin bar across the bottom of the key fills as you consume the context window (200k tokens),
in a colour chosen to contrast with whichever character you pick.

**Make it yours.** Eight characters are bundled — Ember, Robo, Cat, Ghost, Slime, Alien, Pumpkin,
Mochi — each hand-drawn on a smooth 24×24 grid with soft shading. Pick one from the key's settings,
or **import your own** from a small JSON "character pack" (silhouette + palette); imports are added
to the dropdown and shared across every key.

**How it works.** Context Meter plugs into Claude Code's hook system. Three lightweight hooks POST
to a local server the plugin runs on `127.0.0.1:3141` — that's the only thing it talks to. **Nothing
leaves your machine.**

### Requirements

- Elgato Stream Deck hardware + Stream Deck software 6.4+
- [Claude Code](https://claude.ai/code) CLI
- A one-time hook setup in `~/.claude/settings.json` (instructions in the README)

### Open source

MIT-licensed. Source, character-pack format, and setup guide:
https://github.com/mishigo-co/context-meter-for-stream-deck

## Suggested portal metadata

- **Category:** Productivity (or Developer Tools, if available)
- **Tags:** claude code, ai, llm, tokens, context, meter, developer, productivity, coding
- **Support URL:** https://github.com/mishigo-co/context-meter-for-stream-deck

## Note on naming

"Claude Code" is referenced nominatively (compatibility), not as the product name or branding. The
product is "Context Meter"; the mascots are all generic (Ember, Robo, Cat, etc).
