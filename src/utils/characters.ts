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
  /** 12 rows × 12 chars, drawn via {@link LEGEND}. */
  base: string[];
  /** Optional face placement; defaults match the bundled Ember head. */
  anchors?: Partial<Anchors>;
}

export const GRID = 12; // grid width/height in blocks
export const BLOCK = 6; // block size in px (12 × 6 = 72px canvas)

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
 * Renders a pack's base grid to SVG rects. `dy` shifts the whole body vertically
 * (in blocks) for the bob animation. Adjacent same-colour cells in a row are
 * merged into one rect.
 */
export function renderGrid(base: string[], pal: Palette, dy: number): string {
  let s = "";
  for (let row = 0; row < base.length; row++) {
    const line = base[row];
    let col = 0;
    while (col < GRID) {
      const ch = line[col] ?? ".";
      const role = LEGEND[ch] ?? null;
      if (role === null) {
        col++;
        continue;
      }
      let run = 1;
      while (col + run < GRID && line[col + run] === ch) run++;
      const x = col * BLOCK;
      const y = (row + dy) * BLOCK;
      s += `<rect x="${x}" y="${y}" width="${run * BLOCK}" height="${BLOCK}" fill="${pal[role]}"/>`;
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

  if (!Array.isArray(o.base) || o.base.length !== GRID) {
    return { ok: false, error: `"base" must have ${GRID} rows` };
  }
  for (let i = 0; i < GRID; i++) {
    const r = o.base[i];
    if (typeof r !== "string" || r.length !== GRID) {
      return { ok: false, error: `base row ${i} must be ${GRID} characters` };
    }
    for (const ch of r) {
      if (!(ch in LEGEND)) return { ok: false, error: `base row ${i}: illegal character "${ch}"` };
    }
  }

  return { ok: true, pack: obj as CharacterPack };
}

// ── Bundled characters ──────────────────────────────────────────────────────
// Legend: '.'=transparent  B=body  S=shade  H=hilit  W=white  D=dark  G=gray  L=lgray

const ember: CharacterPack = {
  schema: 1,
  id: "ember",
  name: "Ember",
  palette: {
    bg: "#000000",
    body: "#CC2200",
    shade: "#881100",
    hilit: "#FF5533",
    white: "#FFFFFF",
    pupil: "#000000",
    dark: "#440000",
    gray: "#666666",
    lgray: "#AAAAAA",
  },
  base: [
    "..SBBBBBBS..",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    "..SBBBBBBS..",
    ".....SS.....",
    "...SBBBBS...",
    "...SBBBBS...",
    "...SSSSSS...",
  ],
};

const robo: CharacterPack = {
  schema: 1,
  id: "robo",
  name: "Robo",
  palette: {
    bg: "#000000",
    body: "#22AACC",
    shade: "#116688",
    hilit: "#66E0FF",
    white: "#FFFFFF",
    pupil: "#001824",
    dark: "#002A38",
    gray: "#557788",
    lgray: "#99CCDD",
  },
  // Boxy head with antenna, square jaw.
  base: [
    "....HH......",
    "....SS......",
    ".SSSSSSSSSS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SSSSSSSSSS.",
    "...S.SS.S...",
    "..SBBBBBBS..",
    "..SBBBBBBS..",
    "..S.SSSS.S..",
  ],
};

const cat: CharacterPack = {
  schema: 1,
  id: "cat",
  name: "Cat",
  palette: {
    bg: "#000000",
    body: "#E69020",
    shade: "#A85F0E",
    hilit: "#FFC062",
    white: "#FFFFFF",
    pupil: "#1A1000",
    dark: "#3A2400",
    gray: "#7A5A2A",
    lgray: "#D8B070",
  },
  // Rounded head with two pointed ears.
  base: [
    ".S......S...",
    ".SS....SS...",
    ".SBS..SBS...",
    "..SBBBBBBS..",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    "..SBBBBBBS..",
    "...SBBBBS...",
    "..SBBBBBBS..",
    "..SBBBBBBS..",
    "...SSSSSS...",
  ],
};

const ghost: CharacterPack = {
  schema: 1,
  id: "ghost",
  name: "Ghost",
  palette: {
    bg: "#000000",
    body: "#7A5CCC",
    shade: "#4E3A88",
    hilit: "#B49CFF",
    white: "#FFFFFF",
    pupil: "#160E2E",
    dark: "#2A1F4A",
    gray: "#6A5A99",
    lgray: "#C8BCEC",
  },
  // Domed top, wavy skirt, no legs.
  base: [
    "...SBBBBS...",
    "..SBBBBBBS..",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".S.SS.SS.S..",
  ],
};

const slime: CharacterPack = {
  schema: 1,
  id: "slime",
  name: "Slime",
  palette: {
    bg: "#000000",
    body: "#4CC24C",
    shade: "#2E7D2E",
    hilit: "#8FE88F",
    white: "#FFFFFF",
    pupil: "#0A2A0A",
    dark: "#103010",
    gray: "#4A6A4A",
    lgray: "#B8E0B8",
  },
  // Rounded blob, wide drippy base.
  base: [
    "....SBBS....",
    "...SBBBBS...",
    "..SBBBBBBS..",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    "SBBBBBBBBBBS",
    ".SS.SS.SS.S.",
  ],
};

const alien: CharacterPack = {
  schema: 1,
  id: "alien",
  name: "Alien",
  palette: {
    bg: "#000000",
    body: "#3FD6A6",
    shade: "#1E9C74",
    hilit: "#8FF0D0",
    white: "#FFFFFF",
    pupil: "#08221A",
    dark: "#0E3328",
    gray: "#3A6A5A",
    lgray: "#B0EAD8",
  },
  // Antennae, wide head tapering to a small body.
  base: [
    "..H......H..",
    "..S......S..",
    "..SBBBBBBS..",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    ".SBBBBBBBBS.",
    "..SBBBBBBS..",
    "...SBBBBS...",
    "....SBBS....",
    ".....SS.....",
    "....SBBS....",
  ],
};

const pumpkin: CharacterPack = {
  schema: 1,
  id: "pumpkin",
  name: "Pumpkin",
  palette: {
    bg: "#000000",
    body: "#E8821A",
    shade: "#A85A0C",
    hilit: "#FFB259",
    white: "#FFFFFF",
    pupil: "#2A1400",
    dark: "#3A2000",
    gray: "#6A4A1A",
    lgray: "#D89048",
  },
  // Round gourd with a stalk on top.
  base: [
    ".....DD.....",
    "..SBBBBBBS..",
    ".SBBBBBBBBS.",
    "SBBBBBBBBBBS",
    "SBBBBBBBBBBS",
    "SBBBBBBBBBBS",
    "SBBBBBBBBBBS",
    "SBBBBBBBBBBS",
    ".SBBBBBBBBS.",
    "..SBBBBBBS..",
    "...SBBBBS...",
    "....SSSS....",
  ],
};

export const BUNDLED: CharacterPack[] = [ember, robo, cat, ghost, slime, alien, pumpkin];

/** Resolves a character id against bundled ∪ user packs; falls back to Ember. */
export function resolvePack(id: string | undefined, userPacks: CharacterPack[] = []): CharacterPack {
  return [...BUNDLED, ...userPacks].find((p) => p.id === id) ?? BUNDLED[0];
}

/** Lightweight {id,name} listing for the property inspector dropdown. */
export function listCharacters(userPacks: CharacterPack[] = []): { id: string; name: string }[] {
  return [...BUNDLED, ...userPacks].map((p) => ({ id: p.id, name: p.name }));
}
