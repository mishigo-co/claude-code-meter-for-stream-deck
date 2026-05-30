#!/usr/bin/env bash
# Claude Code post-tool-use hook — fires after each tool call.
# Reads the hook payload from stdin (JSON with usage stats).
INPUT=$(cat)
TOKENS=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('usage',{}).get('input_tokens',0)+d.get('usage',{}).get('output_tokens',0))" 2>/dev/null || echo 0)
curl -s -X POST http://127.0.0.1:3141/update \
  -H "Content-Type: application/json" \
  -d "{\"tokens\":$TOKENS,\"isThinking\":false}" > /dev/null 2>&1 || true
