#!/usr/bin/env bash
# Claude Code stop hook — fires when the session ends or /clear is run.
INPUT=$(cat)
TOKENS=$(echo "$INPUT" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('usage',{}).get('input_tokens',0)+d.get('usage',{}).get('output_tokens',0))" 2>/dev/null || echo 0)
if [ "$TOKENS" -gt "0" ] 2>/dev/null; then
  curl -s -X POST http://127.0.0.1:3141/update \
    -H "Content-Type: application/json" \
    -d "{\"tokens\":$TOKENS,\"complete\":true}" > /dev/null 2>&1 || true
else
  curl -s -X POST http://127.0.0.1:3141/update \
    -H "Content-Type: application/json" \
    -d '{"reset":true}' > /dev/null 2>&1 || true
fi
