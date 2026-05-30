const COLS = 4;
const ROWS = 5;
const BLOCK = 10;
const GAP = 2;
const TOTAL = COLS * ROWS; // 20 blocks
const GRID_X = Math.round((72 - (COLS * BLOCK + (COLS - 1) * GAP)) / 2); // 13
const GRID_Y = 5;

const BG          = "#000000";
const EMPTY       = "#222222";
const EMPTY_PULSE = "#444444";
const FILL_DIM    = "#880000";
const FILL        = "#CC0000";
const FILL_TIP    = "#FF3333";
const SNAKE_T1    = "#AA0000";
const SNAKE_T2    = "#771111";
const SNAKE_T3    = "#440000";
const SNAKE_T4    = "#220000";
const TEXT_COL    = "#FF3333";
const TEXT_DIM    = "#882222";

// Boustrophedon path: zigzags so the snake flows without jumping rows.
// Row 0 (bottom) L→R, row 1 R→L, row 2 L→R, ...
const PATH: [number, number][] = [];
for (let r = 0; r < ROWS; r++) {
  const row = ROWS - 1 - r; // bottom-up
  for (let c = 0; c < COLS; c++) {
    const col = r % 2 === 0 ? c : COLS - 1 - c;
    PATH.push([col, row]);
  }
}

export function renderFrame(opts: {
  percentage: number;
  phase: number;
  isThinking: boolean;
  tokens?: number;
}): string {
  const { percentage, phase, isThinking, tokens } = opts;

  const filledCount = Math.round(Math.min(100, Math.max(0, percentage)) / 100 * TOTAL);
  // Snake tip moves through all 20 blocks in ~2.5 seconds (one full loop per phase cycle)
  const snakeTip = Math.floor(phase * TOTAL);

  // Idle pulse
  const pulseOn = !isThinking && tokens === undefined && phase > 0.65 && phase < 0.85;

  // Build a colour-per-path-index map
  const blockFill = new Array<string>(TOTAL);
  if (isThinking) {
    for (let i = 0; i < TOTAL; i++) {
      const dist = (snakeTip - i + TOTAL) % TOTAL;
      if      (dist === 0) blockFill[i] = FILL_TIP;
      else if (dist === 1) blockFill[i] = FILL;
      else if (dist === 2) blockFill[i] = SNAKE_T1;
      else if (dist === 3) blockFill[i] = SNAKE_T2;
      else if (dist === 4) blockFill[i] = SNAKE_T3;
      else if (dist === 5) blockFill[i] = SNAKE_T4;
      else                 blockFill[i] = EMPTY;
    }
  } else {
    for (let i = 0; i < TOTAL; i++) {
      if (i < filledCount)  blockFill[i] = i === filledCount - 1 ? FILL_TIP : i < 2 ? FILL_DIM : FILL;
      else                  blockFill[i] = pulseOn ? EMPTY_PULSE : EMPTY;
    }
  }

  // Render rects in path order
  let rects = "";
  for (let i = 0; i < TOTAL; i++) {
    const [col, row] = PATH[i];
    const x = GRID_X + col * (BLOCK + GAP);
    const y = GRID_Y + row * (BLOCK + GAP);
    rects += `<rect x="${x}" y="${y}" width="${BLOCK}" height="${BLOCK}" rx="1.5" fill="${blockFill[i]}"/>`;
  }

  let labelEl = "";
  if (tokens !== undefined && tokens > 0) {
    labelEl = `<text x="36" y="70" text-anchor="middle" font-family="monospace" font-size="9" fill="${TEXT_COL}" letter-spacing="0.5">${fmtTokens(tokens)}</text>`;
  } else if (isThinking) {
    labelEl = `<text x="36" y="70" text-anchor="middle" font-family="monospace" font-size="9" fill="${TEXT_DIM}">···</text>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="${BG}"/>${rects}${labelEl}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 10_000)    return `${Math.round(n / 1000)}K`;
  if (n >= 1_000)     return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}
