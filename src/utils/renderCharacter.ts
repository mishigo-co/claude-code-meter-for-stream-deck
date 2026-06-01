// Pixel-art character renderer — 12×12 grid, 6px blocks on a 72×72 canvas.
//
// The base body and palette come from a CharacterPack (see characters.ts); the
// face expressions and animated extras below are procedural and shared across
// every character, positioned via the pack's (optional) anchors.

import {
  type Anchors,
  type CharacterPack,
  type Palette,
  BLOCK as S,
  GRID as G,
  DEFAULT_ANCHORS,
  renderGrid,
} from "./characters.js";

function r(x: number, y: number, w: number, h: number, c: string): string {
  return `<rect x="${x * S}" y="${y * S}" width="${w * S}" height="${h * S}" fill="${c}"/>`;
}

// ── Progress-bar colour: complement of the body hue, so it contrasts with any
//    character's palette (bundled or imported) without a per-pack setting. ─────

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r2: number, g2: number, b2: number): string {
  const h = (v: number) => Math.round(v).toString(16).padStart(2, "0");
  return `#${h(r2)}${h(g2)}${h(b2)}`;
}

function rgbToHsl(r2: number, g2: number, b2: number): [number, number, number] {
  r2 /= 255; g2 /= 255; b2 /= 255;
  const max = Math.max(r2, g2, b2), min = Math.min(r2, g2, b2), d = max - min;
  const l = (max + min) / 2;
  let h = 0, s = 0;
  if (d !== 0) {
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r2) h = (g2 - b2) / d + (g2 < b2 ? 6 : 0);
    else if (max === g2) h = (b2 - r2) / d + 2;
    else h = (r2 - g2) / d + 4;
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l * 255, l * 255, l * 255];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const f = (t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
}

/** Vivid complementary colour to the body — high contrast against the character. */
function meterColor(p: Palette): string {
  const [h, s] = rgbToHsl(...hexToRgb(p.body));
  if (s < 0.15) return "#33CCFF"; // grayscale body: fall back to a fixed bright cyan
  return rgbToHex(...hslToRgb((h + 0.5) % 1, Math.max(s, 0.8), 0.6));
}

// ── Face expressions (positioned via anchors, shifted by the bob offset dy) ───

function eyesNormal(a: Anchors, dy: number, p: Palette): string {
  return (
    r(a.eyeLeftX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeLeftX, dy + a.eyesY, 1, 1, p.pupil) +
    r(a.eyeRightX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeRightX + 1, dy + a.eyesY, 1, 1, p.pupil)
  );
}

function eyesBlink(a: Anchors, dy: number, p: Palette): string {
  return r(a.eyeLeftX, dy + a.eyesY + 1, 2, 1, p.shade) + r(a.eyeRightX, dy + a.eyesY + 1, 2, 1, p.shade);
}

function eyesUp(a: Anchors, dy: number, p: Palette): string {
  return (
    r(a.eyeLeftX, dy + a.eyesY - 1, 2, 2, p.white) + r(a.eyeLeftX + 1, dy + a.eyesY - 1, 1, 1, p.pupil) +
    r(a.eyeRightX, dy + a.eyesY - 1, 2, 2, p.white) + r(a.eyeRightX, dy + a.eyesY - 1, 1, 1, p.pupil)
  );
}

function eyesClosed(a: Anchors, dy: number, p: Palette): string {
  return eyesBlink(a, dy, p);
}

function eyesWide(a: Anchors, dy: number, p: Palette): string {
  return (
    r(a.eyeLeftX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeLeftX, dy + a.eyesY + 1, 1, 1, p.pupil) +
    r(a.eyeRightX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeRightX + 1, dy + a.eyesY + 1, 1, 1, p.pupil) +
    r(a.eyeLeftX - 1, dy + a.eyesY - 1, 1, 1, p.hilit) + r(a.eyeRightX + 2, dy + a.eyesY - 1, 1, 1, p.hilit)
  );
}

function mouthNeutral(a: Anchors, dy: number, p: Palette): string {
  return r(a.mouthX, dy + a.mouthY, 4, 1, p.shade);
}

function mouthSmile(a: Anchors, dy: number, p: Palette): string {
  return (
    r(a.mouthX, dy + a.mouthY, 4, 1, p.shade) +
    r(a.mouthX - 1, dy + a.mouthY - 1, 1, 1, p.shade) + r(a.mouthX + 4, dy + a.mouthY - 1, 1, 1, p.shade)
  );
}

function mouthOpen(a: Anchors, dy: number, p: Palette): string {
  return r(a.mouthX, dy + a.mouthY - 1, 4, 2, p.dark) + r(a.mouthX + 1, dy + a.mouthY, 2, 1, p.gray);
}

function mouthSleep(a: Anchors, dy: number, p: Palette): string {
  return r(a.mouthX + 1, dy + a.mouthY, 2, 1, p.shade);
}

// ── Accessories (fixed positions around the character) ────────────────────────

function thinkingDots(phase: number, p: Palette): string {
  let s = "";
  const dots = [3, 5, 7];
  for (let i = 0; i < 3; i++) {
    const bounce = Math.sin((phase * Math.PI * 2) - i * 0.8) > 0.3 ? -1 : 0;
    s += r(dots[i], 11 + bounce, 2, 1, p.hilit);
  }
  return s;
}

function zzzBubbles(phase: number, p: Palette): string {
  let s = "";
  const drift = Math.floor(phase * 4) % 4;
  const y1 = Math.max(0, 3 - drift);
  s += r(9, y1, 2, 1, p.lgray) + r(10, y1 + 1, 1, 1, p.lgray) + r(9, y1 + 2, 2, 1, p.lgray);
  if (drift < 2) {
    const y2 = Math.max(0, 1 - Math.floor(drift / 2));
    s += r(10, y2, 1, 1, p.gray) + r(10, y2 + 1, 1, 1, p.gray);
  }
  return s;
}

function successSparks(phase: number, p: Palette): string {
  let s = "";
  const on = Math.sin(phase * Math.PI * 4) > 0;
  if (on) {
    s += r(0, 2, 1, 1, p.hilit) + r(11, 3, 1, 1, p.hilit);
    s += r(1, 0, 1, 1, p.hilit) + r(10, 1, 1, 1, p.hilit);
  } else {
    s += r(1, 1, 1, 1, p.hilit) + r(10, 2, 1, 1, p.hilit);
    s += r(0, 3, 1, 1, p.hilit) + r(11, 0, 1, 1, p.hilit);
  }
  return s;
}

function generatingBars(phase: number, p: Palette): string {
  const len = [2, 3, 1, 2];
  let s = "";
  for (let i = 0; i < 4; i++) {
    const active = Math.floor(phase * 4) === i;
    s += r(2 + i * 2, 11, len[i] + (active ? 1 : 0), 1, active ? p.hilit : p.shade);
  }
  return s;
}

// ── State renderer ────────────────────────────────────────────────────────────

export function renderCharacter(opts: {
  pack: CharacterPack;
  state: "idle" | "thinking" | "generating" | "success" | "sleeping";
  phase: number;
  tokens?: number;
}): string {
  const { pack, state, phase } = opts;
  const p = pack.palette;
  const a: Anchors = { ...DEFAULT_ANCHORS, ...pack.anchors };

  const bob = Math.round(Math.sin(phase * Math.PI * 2) * 0.7); // ±1 block bob
  const blink = phase > 0.88 && phase < 0.95; // brief blink near end of cycle

  const body = renderGrid(pack.base, p, bob);
  let face = "";
  let extras = "";

  switch (state) {
    case "idle":
      face = (blink ? eyesBlink(a, bob, p) : eyesNormal(a, bob, p)) + mouthNeutral(a, bob, p);
      break;
    case "thinking":
      face = eyesUp(a, bob, p) + mouthNeutral(a, bob, p);
      extras = thinkingDots(phase, p);
      break;
    case "generating":
      face = (blink ? eyesBlink(a, bob, p) : eyesNormal(a, bob, p)) + mouthOpen(a, bob, p);
      extras = generatingBars(phase, p);
      break;
    case "success":
      face = eyesWide(a, bob, p) + mouthSmile(a, bob, p);
      extras = successSparks(phase, p);
      break;
    case "sleeping":
      face = eyesClosed(a, bob, p) + mouthSleep(a, bob, p);
      extras = zzzBubbles(phase, p);
      break;
  }

  // Token bar at bottom (2px tall strip)
  let tokenBar = "";
  if (opts.tokens !== undefined && opts.tokens > 0) {
    const pct = Math.min(1, opts.tokens / 200_000);
    const filled = Math.round(pct * G);
    if (filled > 0) tokenBar += `<rect x="0" y="70" width="${filled * S}" height="2" fill="${meterColor(p)}"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72">` +
    `<rect width="72" height="72" fill="${p.bg}"/>` +
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
