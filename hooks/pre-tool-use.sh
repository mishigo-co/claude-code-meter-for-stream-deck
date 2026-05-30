#!/usr/bin/env bash
# Claude Code pre-tool-use hook — fires before each tool call (Claude is thinking/acting).
curl -s -X POST http://127.0.0.1:3141/update \
  -H "Content-Type: application/json" \
  -d '{"isThinking":true}' > /dev/null 2>&1 || true
