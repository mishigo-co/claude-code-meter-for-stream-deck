// Character packs: data-driven silhouette + palette.
//
// A "pack" supplies only the base body grid and the colour palette. The face
// (eyes/mouth) and all motion (bob, blink, thinking dots, Z's, sparkles, typing
// bars) stay procedural in renderCharacter.ts and are shared by every character.
// This keeps packs tiny and hand-editable while preserving the animation.

export interface Palette {
  bg: string;
  body: string;
  shade: string;
  hilit: string;
  white: string;
  pupil: string;
  dark: string;
  gray: string;
  lgray: string;
}

export interface Anchors {
  eyeLeftX: number;
  eyeRightX: number;
  eyesY: number;
  mouthX: number;
  mouthY: number;
}

export interface CharacterPack {
  schema: number;
  id: string;
  name: string;
  palette: Palette;
  /** N rows × N chars (N = `grid`, default 12), drawn via {@link LEGEND}. */
  base: string[];
  /**
   * Body grid resolution. 12 (default) → 6px blocks; 24 → 3px blocks (smoother
   * silhouette / shading). Face & motion stay on the 12-grid for parity.
   */
  grid?: 12 | 24;
  /** Optional face placement; defaults match the bundled Ember head. */
  anchors?: Partial<Anchors>;
}

export const GRID = 12; // default grid width/height in blocks
export const BLOCK = 6; // default block size in px (12 × 6 = 72px canvas)
export const CANVAS = 72;

export const DEFAULT_ANCHORS: Anchors = {
  eyeLeftX: 3,
  eyeRightX: 7,
  eyesY: 3,
  mouthX: 4,
  mouthY: 6,
};

// Base-grid legend: single char → palette role (null = transparent).
const LEGEND: Record<string, keyof Palette | null> = {
  ".": null,
  " ": null,
  B: "body",
  S: "shade",
  H: "hilit",
  W: "white",
  D: "dark",
  G: "gray",
  L: "lgray",
  P: "pupil",
};

const PALETTE_ROLES: (keyof Palette)[] = [
  "bg",
  "body",
  "shade",
  "hilit",
  "white",
  "pupil",
  "dark",
  "gray",
  "lgray",
];

/**
 * Renders a pack's base grid to SVG rects. `dyPx` shifts the whole body
 * vertically (in pixels) for the bob animation — kept in pixels so packs at
 * different grid resolutions bob the same visual amount. Adjacent same-colour
 * cells in a row are merged into one rect.
 */
export function renderGrid(
  base: string[],
  pal: Palette,
  dyPx: number,
  gridSize: number = GRID,
): string {
  const block = CANVAS / gridSize;
  let s = "";
  for (let row = 0; row < gridSize; row++) {
    const line = base[row];
    let col = 0;
    while (col < gridSize) {
      const ch = line[col] ?? ".";
      const role = LEGEND[ch] ?? null;
      if (role === null) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < gridSize && line[col + run] === ch) run++;
      const x = col * block;
      const y = row * block + dyPx;
      s += `<rect x="${x}" y="${y}" width="${run * block}" height="${block}" fill="${pal[role]}"/>`;
      col += run;
    }
  }
  return s;
}

export type ValidationResult =
  | { ok: true; pack: CharacterPack }
  | { ok: false; error: string };

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Validates an untrusted object as a CharacterPack (used when importing). */
export function validatePack(obj: unknown): ValidationResult {
  if (typeof obj !== "object" || obj === null) return { ok: false, error: "Not a JSON object" };
  const o = obj as Record<string, unknown>;

  if (o.schema !== 1) return { ok: false, error: "Unsupported schema (expected 1)" };
  if (typeof o.id !== "string" || !o.id.trim()) return { ok: false, error: "Missing \"id\"" };
  if (typeof o.name !== "string" || !o.name.trim()) return { ok: false, error: "Missing \"name\"" };

  const pal = o.palette;
  if (typeof pal !== "object" || pal === null) return { ok: false, error: "Missing \"palette\"" };
  for (const role of PALETTE_ROLES) {
    const v = (pal as Record<string, unknown>)[role];
    if (typeof v !== "string" || !HEX.test(v)) {
      return { ok: false, error: `palette.${role} must be a #rrggbb hex colour` };
    }
  }

  const grid = o.grid === 24 ? 24 : 12;
  if (o.grid !== undefined && o.grid !== 12 && o.grid !== 24) {
    return { ok: false, error: `"grid" must be 12 or 24` };
  }
  if (!Array.isArray(o.base) || o.base.length !== grid) {
    return { ok: false, error: `"base" must have ${grid} rows` };
  }
  for (let i = 0; i < grid; i++) {
    const r = o.base[i];
    if (typeof r !== "string" || r.length !== grid) {
      return { ok: false, error: `base row ${i} must be ${grid} characters` };
    }
    for (const ch of r) {
      if (!(ch in LEGEND)) return { ok: false, error: `base row ${i}: illegal character "${ch}"` };
    }
  }

  return { ok: true, pack: obj as CharacterPack };
}

// ── Bundled characters ──────────────────────────────────────────────────────
// Legend: '.'=transparent  B=body  S=shade  H=hilit  W=white  D=dark  G=gray  L=lgray

// All bundled packs are drawn at 24×24 (set via `grid`) so the silhouettes have
// smooth outlines and soft shading (H/L for highlight, G/D for shadow). The
// face-overlay zone (cols 6–17, rows 6–15) is kept solid `B` so the procedural
// 12-grid eyes/mouth land cleanly on every silhouette.

const ember: CharacterPack = {
  schema: 1,
  id: "ember",
  name: "Ember",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#CC2200",
    shade: "#5C0F00",
    hilit: "#FF8855",
    white: "#FFFFFF",
    pupil: "#000000",
    dark: "#3A0000",
    gray: "#882211",
    lgray: "#FFB099",
  },
  base: [
    "........................",
    ".........SSSSSS.........",
    ".......SSBBBBBBSS.......",
    ".....SSLLLBBBBBBBSS.....",
    "....SLHHHLLBBBBBBBBS....",
    "...SSHHHHHLLBBBBBBBSS...",
    "...SLHBBBBBBBBBBBBBBS...",
    "..SLLHBBBBBBBBBBBBBBBS..",
    "..SBLLBBBBBBBBBBBBBBBS..",
    "..SBBLBBBBBBBBBBBBGBBS..",
    "..SBBBBBBBBBBBBBBBGGGS..",
    "..SBBBBBBBBBBBBBBBDGGS..",
    "...SBBBBBBBBBBBBBBDDS...",
    "...SSBBBBBBBBBBBBBDSS...",
    "....SBBBBBBBBBBBBBDS....",
    ".....SSBBBBBBBBBBSS.....",
    ".......SSBBBBGGSS.......",
    "........................",
    ".......SSSS..SSSS.......",
    ".......SBBS..SBBS.......",
    ".......SBBS..SBBS.......",
    ".......SBBS..SBBS.......",
    ".......SSSS..SSSS.......",
    "........................",
  ],
};

const robo: CharacterPack = {
  schema: 1,
  id: "robo",
  name: "Robo",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#22AACC",
    shade: "#0E4A66",
    hilit: "#88E8FF",
    white: "#FFFFFF",
    pupil: "#001824",
    dark: "#012636",
    gray: "#3C7F9C",
    lgray: "#A8DDEF",
  },
  // Compact head with antenna + riveted collar + chunky shoulders body.
  base: [
    "...........HH...........",
    "...........SS...........",
    "...........SS...........",
    "........................",
    "....SSSSSSSSSSSSSSSS....",
    "....SHHHLLBBBBBBBBBS....",
    "....SHBBBBBBBBBBBBBS....",
    "....SHBBBBBBBBBBBBBS....",
    "....SLBBBBBBBBBBBBBS....",
    "....SLBBBBBBBBBBBBBS....",
    "....SBBBBBBBBBBBBBBS....",
    "....SBBBBBBBBBBBBBBS....",
    "....SBBBBBBBBBBBBBBS....",
    "....SSSSSSSSSSSSSSSS....",
    ".SSDSSSSDSSSSSSDSSSSDSS.",
    ".SSSSSSSSSSSSSSSSSSSSSS.",
    ".SBBBBBBBBBBBBBBGGGGGGS.",
    ".SBBBBBBBBBBBBBBGGDDDGS.",
    ".SBBBBBBBBBBBBBGGDDDDDS.",
    ".SBBBBBBBBBBBBBGGDDDDDS.",
    ".SBBBBBBBBBBBBBGGDDDDDS.",
    ".SBBBBBBBBBBBBBBGGDDDGS.",
    ".SSSSSSSSSSSSSSSSSSSSSS.",
    "........................",
  ],
};

const cat: CharacterPack = {
  schema: 1,
  id: "cat",
  name: "Cat",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#E69020",
    shade: "#5A2E00",
    hilit: "#FFC062",
    white: "#FFFFFF",
    pupil: "#1A1000",
    dark: "#3A2400",
    gray: "#9A5E20",
    lgray: "#FFD78A",
  },
  // Rounded mascot head with two pointed ears (merged into the silhouette).
  base: [
    "......S..........S......",
    ".....SBS........SBS.....",
    ".....SBS........SBS.....",
    ".....SLS........SLS.....",
    ".....SLLSSSSSSSSBLS.....",
    "....SLLLLLBBBBBBLLLS....",
    ".....SLBBBBBBBBBBLS.....",
    "....SHBBBBBBBBBBBBBS....",
    "...SHHBBBBBBBBBBBBBBS...",
    "..SLLHBBBBBBBBBBBBBBBS..",
    "..SBLLBBBBBBBBBBBBBBBS..",
    "..SBBBBBBBBBBBBBBBBBBS..",
    "..SGGBBBBBBBBBBBBBGGGS..",
    ".SBBBBBBBBBBBBBBBBGGGBS.",
    "..SBBBBBBBBBBBBBBBDGGS..",
    "..SBBBBBBBBBBBBBBBDDGS..",
    "..SBBBBBBBBBGGDDDDDDDS..",
    "..SBBBBBBBBBGGDDDDDDDS..",
    "...SBBBBBBBBGGDDDDDDS...",
    "....SBBBBBBBBGGDDDDS....",
    ".....SBBBBBBBGGGDDS.....",
    "......SBBBBBBBGGGS......",
    ".......SSSSSSSSSS.......",
    "........................",
  ],
};

const ghost: CharacterPack = {
  schema: 1,
  id: "ghost",
  name: "Ghost",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#7A5CCC",
    shade: "#2A1A55",
    hilit: "#D4C2FF",
    white: "#FFFFFF",
    pupil: "#160E2E",
    dark: "#1F1340",
    gray: "#5A4884",
    lgray: "#D8CCF5",
  },
  // Domed top, scalloped skirt, no legs.
  base: [
    ".........SSSSSS.........",
    ".....SSLBBBBBBBBBSS.....",
    "...SSLLLLBBBBBBBBBBSS...",
    "..SSLHHHLLBBBBBBBBBBSS..",
    "..SLHHHHHLLBBBBBBBBBBS..",
    "..SLHHHHHLLBBBBBBBBBBS..",
    "..SLHHBBBBBBBBBBBBBBBS..",
    "..SLLHBBBBBBBBBBBBBBBS..",
    "..SBLLBBBBBBBBBBBBBBBS..",
    "..SBBLBBBBBBBBBBBBBBBS..",
    "..SBBBBBBBBBBBBBBBGGBS..",
    "..SBBBBBBBBBBBBBBBGGGS..",
    "..SBBBBBBBBBBBBBBBDDGS..",
    "..SBBBBBBBBBBBBBBBDDDS..",
    "..SBBBBBBBBBBBBBBBDDDS..",
    "..SBBBBBBBBBBBBBBBDDDS..",
    "..SBBBBBBBBBBGGDDDDDDS..",
    "..SBBBBBBBBBBBGGDDDDDS..",
    "..SBBBBBBBBBBBGGGDDDGS..",
    "..SBBBBS.SBBBBS.SGGGGS..",
    "..SBBBBS.SBBBBS.SGGGBS..",
    "...SBBS...SBBS...SBBS...",
    "....SS.....SS.....SS....",
    "........................",
  ],
};

const slime: CharacterPack = {
  schema: 1,
  id: "slime",
  name: "Slime",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#4CC24C",
    shade: "#0E4A0E",
    hilit: "#B8F5B8",
    white: "#FFFFFF",
    pupil: "#0A2A0A",
    dark: "#103010",
    gray: "#356635",
    lgray: "#C8F0C8",
  },
  // Rounded blob with three drips.
  base: [
    "......SBBBBBBBBBBS......",
    "......SBBBBBBBBBBS......",
    ".....SLLLBBBBBBBBBS.....",
    ".....SLLLLBBBBBBBBS.....",
    ".....SHHHLLBBBBBBBS.....",
    "....SHHHHHLLBBBBBBBS....",
    "....SHBBBBBBBBBBBBBS....",
    "...SLHBBBBBBBBBBBBBBS...",
    "...SLLBBBBBBBBBBBBBBS...",
    "...SBLBBBBBBBBBBBBBBS...",
    "..SBBBBBBBBBBBBBBBBBBS..",
    "..SBBBBBBBBBBBBBBBBBBS..",
    "..SBBBBBBBBBBBBBBBGBBS..",
    "..SBBBBBBBBBBBBBBBGGGS..",
    ".SBBBBBBBBBBBBBBBBDGGGS.",
    ".SBBBBBBBBBBBBBBBBDDGGS.",
    ".SBBBBBBBBBBGGDDDDDDDGS.",
    ".SBBBBBBBBBBGGDDDDDDDGS.",
    ".SBBBBBBBBBBGGDDDDDDDGS.",
    ".SBBBBBBBBBBBGGDDDDDGGS.",
    ".SBBBBBBBBBBBGGGDDDGGGS.",
    "...SBBBS..SBBS..SGGGS...",
    "....SBS...SBBS...SGS....",
    "........................",
  ],
};

const alien: CharacterPack = {
  schema: 1,
  id: "alien",
  name: "Alien",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#3FD6A6",
    shade: "#0E4A38",
    hilit: "#A8FFE0",
    white: "#FFFFFF",
    pupil: "#08221A",
    dark: "#0E3328",
    gray: "#2A8868",
    lgray: "#C0F5DE",
  },
  // Antennae with a single continuous teardrop body.
  base: [
    ".....H............H.....",
    ".....S............S.....",
    ".....S............S.....",
    ".....S............S.....",
    ".........SLBBBS.........",
    ".......SHHLLBBBBS.......",
    ".....SBBBBBBBBBBBBS.....",
    "...SLHBBBBBBBBBBBBBBS...",
    "..SBLLBBBBBBBBBBBBGBBS..",
    "..SBBLBBBBBBBBBBBBGGGS..",
    "..SBBBBBBBBBBBBBBBDGGS..",
    "..SBBBBBBBBBBBBBBBDDGS..",
    "...SBBBBBBBBBBBBBBDDS...",
    "...SBBBBBBBBBBBBBBDDS...",
    "....SBBBBBBBBBBBBBDS....",
    "....SBBBBBBBBBBBBBDS....",
    ".....SBBBBBBBGGGDDS.....",
    "......SBBBBBBBGGGS......",
    ".......SBBBBBBBBS.......",
    "........SBBBBBBS........",
    ".........SBBBBS.........",
    "..........SBBS..........",
    "........................",
    "........................",
  ],
};

const pumpkin: CharacterPack = {
  schema: 1,
  id: "pumpkin",
  name: "Pumpkin",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#E8821A",
    shade: "#5A2E00",
    hilit: "#FFC85F",
    white: "#FFFFFF",
    pupil: "#2A1400",
    dark: "#3A2000",
    gray: "#A8580A",
    lgray: "#FFCB7A",
  },
  // Wide gourd with stalk and two soft ribs.
  base: [
    "..........SSSS..........",
    "..........SDDS..........",
    "..........SDDS..........",
    ".........SSSSSS.........",
    "......SSSSBBBBSSSS......",
    ".....SSGHLLBBBBBGSS.....",
    "....SSBGBBBBBBBBGBSS....",
    "...SLHBGBBBBBBBBGBBBS...",
    "..SSLHBGBBBBBBBBGBBBSS..",
    "..SBLLBGBBBBBBBBGBBBBS..",
    ".SSBBLBGBBBBBBBBGBBBBSS.",
    ".SBBBBBGBBBBBBBBGBBBBBS.",
    ".SBBBBBGBBBBBBBBGBBBBBS.",
    ".SBBBBBGBBBBBBBBGBGGGBS.",
    ".SSBBBBGBBBBBBBBGBGGGGS.",
    "..SBBBBGBBBBBBBBGBDDGSS.",
    "..SBBBBGBBBBGGDDGDDDDS..",
    "..SSBBBGBBBBGGDDGDDDSS..",
    "...SBBBGBBBBGGDDGDDDS...",
    "....SSBGBBBBGGDDGDSS....",
    ".....SSGBBBBGGDDGSS.....",
    "......SSSSBBGGSSSS......",
    ".........SSSSSS.........",
    "........................",
  ],
};

const mochi: CharacterPack = {
  schema: 1,
  id: "mochi",
  name: "Mochi",
  grid: 24,
  palette: {
    bg: "#000000",
    body: "#F2D5C2",
    shade: "#B47A5E",
    hilit: "#FFE9DA",
    white: "#FFFFFF",
    pupil: "#2A1A14",
    dark: "#7A4A36",
    gray: "#C99880",
    lgray: "#FFDFCC",
  },
  base: [
    "........................",
    "........SSSSSSSS........",
    "......SSSBBBBBBSSS......",
    ".....SSLLLBBBBBBBSS.....",
    "....SSHHLLLBBBBBBBSS....",
    "...SSHHHHLLBBBBBBBBSS...",
    "...SLHBBBBBBBBBBBBBBS...",
    "..SSLHBBBBBBBBBBBBBBSS..",
    "..SLLLBBBBBBBBBBBBBBBS..",
    "..SBLLBBBBBBBBBBBBBBBS..",
    ".SSBBBBBBBBBBBBBBBBBBSS.",
    ".SSBBBBBBBBBBBBBBBBBBSS.",
    ".SSBBBBBBBBBBBBBBBGGGSS.",
    ".SSBBBBBBBBBBBBBBBGGGSS.",
    "..SBBBBBBBBBGGGDDDDDGS..",
    "..SBBBBBBBBBGGDDDDDDDS..",
    "..SSBBBBBBBBGGDDDDDDSS..",
    "...SBBBBBBBBGGDDDDDDS...",
    "...SSBBBBBBBGGDDDDDSS...",
    "....SSBBBBBBGGDDDDSS....",
    ".....SSBBBBBGGGDDSS.....",
    "......SSSBBBBGGSSS......",
    "........SSSSSSSS........",
    "........................",
  ],
};

export const BUNDLED: CharacterPack[] = [ember, robo, cat, ghost, slime, alien, pumpkin, mochi];

/** Resolves a character id against bundled ∪ user packs; falls back to Ember. */
export function resolvePack(id: string | undefined, userPacks: CharacterPack[] = []): CharacterPack {
  return [...BUNDLED, ...userPacks].find((p) => p.id === id) ?? BUNDLED[0];
}

/** Lightweight {id,name} listing for the property inspector dropdown. */
export function listCharacters(userPacks: CharacterPack[] = []): { id: string; name: string }[] {
  return [...BUNDLED, ...userPacks].map((p) => ({ id: p.id, name: p.name }));
}
