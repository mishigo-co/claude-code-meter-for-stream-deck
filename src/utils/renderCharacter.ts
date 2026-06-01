// Pixel-art character renderer — 12×12 grid, 6px blocks on a 72×72 canvas.
// Each block is 6×6 solid pixels (no gaps), giving a crisp retro look.

const S = 6;   // block size in px
const G = 12;  // grid width/height

// Palette
const BG    = "#000000";
const BODY  = "#CC2200";
const SHADE = "#881100";
const HILIT = "#FF5533";
const WHITE = "#FFFFFF";
const PUPIL = "#000000";
const DARK  = "#440000";
const GRAY  = "#666666";
const LGRAY = "#AAAAAA";

function r(x: number, y: number, w = 1, h = 1, c: string): string {
  return `<rect x="${x * S}" y="${y * S}" width="${w * S}" height="${h * S}" fill="${c}"/>`;
}

// Base head + body shape (state-independent)
function drawBase(dy: number): string {
  let s = "";
  const y = dy; // vertical offset for bob animation

  // Head outline (shade)
  s += r(2, y+0, 8, 1, SHADE);
  s += r(1, y+1, 10, 6, SHADE);
  s += r(2, y+7, 8, 1, SHADE);

  // Head fill
  s += r(3, y+0, 6, 1, BODY);
  s += r(2, y+1, 8, 6, BODY);
  s += r(3, y+7, 6, 1, BODY);

  // Neck
  s += r(5, y+8, 2, 1, SHADE);

  // Body outline
  s += r(3, y+9,  6, 3, SHADE);

  // Body fill
  s += r(4, y+9,  4, 2, BODY);
  s += r(4, y+11, 4, 1, SHADE);

  // Legs
  s += r(4, y+11, 1, 1, SHADE);
  s += r(7, y+11, 1, 1, SHADE);

  return s;
}

// ── Face expressions ─────────────────────────────────────────────────────────

function eyesNormal(dy: number): string {
  return (
    r(3, dy+3, 2, 2, WHITE) + r(3, dy+3, 1, 1, PUPIL) +
    r(7, dy+3, 2, 2, WHITE) + r(8, dy+3, 1, 1, PUPIL)
  );
}

function eyesBlink(dy: number): string {
  return r(3, dy+4, 2, 1, SHADE) + r(7, dy+4, 2, 1, SHADE);
}

function eyesUp(dy: number): string {
  // Eyes looking up (thinking)
  return (
    r(3, dy+2, 2, 2, WHITE) + r(4, dy+2, 1, 1, PUPIL) +
    r(7, dy+2, 2, 2, WHITE) + r(7, dy+2, 1, 1, PUPIL)
  );
}

function eyesClosed(dy: number): string {
  return r(3, dy+4, 2, 1, SHADE) + r(7, dy+4, 2, 1, SHADE);
}

function eyesWide(dy: number): string {
  // Wide happy eyes
  return (
    r(3, dy+3, 2, 2, WHITE) + r(3, dy+4, 1, 1, PUPIL) +
    r(7, dy+3, 2, 2, WHITE) + r(8, dy+4, 1, 1, PUPIL) +
    r(2, dy+2, 1, 1, HILIT) + r(9, dy+2, 1, 1, HILIT) // highlight
  );
}

function mouthNeutral(dy: number): string {
  return r(4, dy+6, 4, 1, SHADE);
}

function mouthSmile(dy: number): string {
  return (
    r(4, dy+6, 4, 1, SHADE) +
    r(3, dy+5, 1, 1, SHADE) + r(8, dy+5, 1, 1, SHADE)
  );
}

function mouthOpen(dy: number): string {
  return r(4, dy+5, 4, 2, DARK) + r(5, dy+6, 2, 1, GRAY);
}

function mouthSleep(dy: number): string {
  return r(5, dy+6, 2, 1, SHADE);
}

// ── Accessories ───────────────────────────────────────────────────────────────

function thinkingDots(phase: number): string {
  // Three dots that bounce independently
  let s = "";
  const dots = [3, 5, 7];
  for (let i = 0; i < 3; i++) {
    const bounce = Math.sin((phase * Math.PI * 2) - i * 0.8) > 0.3 ? -1 : 0;
    s += r(dots[i], 11 + bounce, 2, 1, HILIT);
  }
  return s;
}

function zzzBubbles(phase: number): string {
  // Two Z glyphs floating upward
  let s = "";
  const drift = Math.floor(phase * 4) % 4;
  // small Z at (9, 2-drift)
  const y1 = Math.max(0, 3 - drift);
  s += r(9, y1, 2, 1, LGRAY) + r(10, y1+1, 1, 1, LGRAY) + r(9, y1+2, 2, 1, LGRAY);
  // tiny Z at (10, 1 - drift/2)
  if (drift < 2) {
    const y2 = Math.max(0, 1 - Math.floor(drift / 2));
    s += r(10, y2, 1, 1, GRAY) + r(10, y2+1, 1, 1, GRAY);
  }
  return s;
}

function successSparks(phase: number): string {
  // Small sparkles around the character
  let s = "";
  const on = Math.sin(phase * Math.PI * 4) > 0;
  if (on) {
    s += r(0, 2, 1, 1, HILIT) + r(11, 3, 1, 1, HILIT);
    s += r(1, 0, 1, 1, HILIT) + r(10, 1, 1, 1, HILIT);
  } else {
    s += r(1, 1, 1, 1, HILIT) + r(10, 2, 1, 1, HILIT);
    s += r(0, 3, 1, 1, HILIT) + r(11, 0, 1, 1, HILIT);
  }
  return s;
}

function generatingBars(phase: number): string {
  // Small animated bars below body (typing indicator)
  const len = [2, 3, 1, 2];
  let s = "";
  for (let i = 0; i < 4; i++) {
    const active = Math.floor(phase * 4) === i;
    s += r(2 + i * 2, 11, len[i] + (active ? 1 : 0), 1, active ? HILIT : SHADE);
  }
  return s;
}

// ── State renderers ───────────────────────────────────────────────────────────

export function renderCharacter(opts: {
  state: "idle" | "thinking" | "generating" | "success" | "sleeping";
  phase: number;
  tokens?: number;
}): string {
  const { state, phase } = opts;

  const bob = Math.round(Math.sin(phase * Math.PI * 2) * 0.7); // ±1 block bob
  const blink = phase > 0.88 && phase < 0.95; // brief blink near end of cycle

  let body = "";
  let face = "";
  let extras = "";

  body = drawBase(bob);

  switch (state) {
    case "idle":
      face = (blink ? eyesBlink(bob) : eyesNormal(bob)) + mouthNeutral(bob);
      break;

    case "thinking":
      face = eyesUp(bob) + mouthNeutral(bob);
      extras = thinkingDots(phase);
      break;

    case "generating":
      face = (blink ? eyesBlink(bob) : eyesNormal(bob)) + mouthOpen(bob);
      extras = generatingBars(phase);
      break;

    case "success":
      face = eyesWide(bob) + mouthSmile(bob);
      extras = successSparks(phase);
      break;

    case "sleeping":
      face = eyesClosed(bob) + mouthSleep(bob);
      extras = zzzBubbles(phase);
      break;
  }

  // Token bar at bottom (2px tall strip)
  let tokenBar = "";
  if (opts.tokens !== undefined && opts.tokens > 0) {
    const pct = Math.min(1, opts.tokens / 200_000);
    const filled = Math.round(pct * G);
    if (filled > 0) tokenBar += `<rect x="0" y="70" width="${filled * S}" height="2" fill="${HILIT}"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72">` +
    `<rect width="72" height="72" fill="${BG}"/>` +
    body + face + extras + tokenBar +
    `</svg>`;

  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${Math.round(n / 1000)}K`;
  if (n >= 1_000)     return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
