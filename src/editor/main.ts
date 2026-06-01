// Standalone character-pack editor — reuses the Stream Deck renderer so the
// preview matches exactly what the plugin will draw on the key.
import { type CharacterPack, type Palette, validatePack } from "../utils/characters.js";
import { renderCharacter } from "../utils/renderCharacter.js";

type Role = "B" | "S" | "H" | "W" | "D" | "G" | "L" | "P" | ".";

const ROLES: { role: Role; key: keyof Palette | "transparent"; label: string }[] = [
	{ role: "B", key: "body", label: "Body" },
	{ role: "S", key: "shade", label: "Shade" },
	{ role: "H", key: "hilit", label: "Hilit" },
	{ role: "L", key: "lgray", label: "L-gray" },
	{ role: "G", key: "gray", label: "Gray" },
	{ role: "D", key: "dark", label: "Dark" },
	{ role: "W", key: "white", label: "White" },
	{ role: "P", key: "pupil", label: "Pupil" },
	{ role: ".", key: "transparent", label: "Erase" },
];

const PALETTE_FIELDS: (keyof Palette)[] = [
	"bg",
	"body",
	"shade",
	"hilit",
	"lgray",
	"gray",
	"dark",
	"white",
	"pupil",
];

const DEFAULT_PALETTE: Palette = {
	bg: "#000000",
	body: "#4DABF5",
	shade: "#1F5F8C",
	hilit: "#A8DAFF",
	white: "#FFFFFF",
	pupil: "#0A1929",
	dark: "#0E2E4A",
	gray: "#3C7AAB",
	lgray: "#C9E4F8",
};

const CANVAS_PX = 480;

interface State {
	id: string;
	name: string;
	grid: 12 | 24;
	palette: Palette;
	cells: Role[][]; // [row][col]
	tool: Role;
	previewState: "idle" | "thinking" | "generating" | "success" | "sleeping";
}

function makeEmptyCells(grid: 12 | 24): Role[][] {
	return Array.from({ length: grid }, () => Array.from({ length: grid }, () => "." as Role));
}

function defaultBaseAt(grid: 12 | 24): Role[][] {
	// Start with a centered solid blob so the user has something to edit immediately.
	const cells = makeEmptyCells(grid);
	const cx = (grid - 1) / 2;
	const cy = (grid - 1) / 2;
	const r = grid === 12 ? 4.5 : 9.5;
	for (let row = 0; row < grid; row++) {
		for (let col = 0; col < grid; col++) {
			const d = Math.hypot(col - cx, row - cy);
			if (d <= r * 0.9) cells[row][col] = "B";
			else if (d <= r) cells[row][col] = "S";
		}
	}
	return cells;
}

const state: State = {
	id: "mychar",
	name: "My Character",
	grid: 24,
	palette: { ...DEFAULT_PALETTE },
	cells: defaultBaseAt(24),
	tool: "B",
	previewState: "idle",
};

// ── Painter ────────────────────────────────────────────────────────────────
const painter = document.getElementById("painter") as HTMLCanvasElement;
const ctx = painter.getContext("2d") as CanvasRenderingContext2D;
let painting = false;

function roleColor(r: Role): string | null {
	if (r === ".") return null;
	const map: Record<Exclude<Role, ".">, keyof Palette> = {
		B: "body",
		S: "shade",
		H: "hilit",
		W: "white",
		D: "dark",
		G: "gray",
		L: "lgray",
		P: "pupil",
	};
	return state.palette[map[r]];
}

function drawPainter(): void {
	const g = state.grid;
	const block = CANVAS_PX / g;
	ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
	// background (checkerboard already on the canvas via CSS); paint cells.
	for (let row = 0; row < g; row++) {
		for (let col = 0; col < g; col++) {
			const c = roleColor(state.cells[row][col]);
			if (!c) continue;
			ctx.fillStyle = c;
			ctx.fillRect(col * block, row * block, block, block);
		}
	}
	// grid lines (subtle)
	ctx.strokeStyle = "rgba(255,255,255,0.07)";
	ctx.lineWidth = 1;
	for (let i = 0; i <= g; i++) {
		const p = i * block;
		ctx.beginPath();
		ctx.moveTo(p + 0.5, 0);
		ctx.lineTo(p + 0.5, CANVAS_PX);
		ctx.moveTo(0, p + 0.5);
		ctx.lineTo(CANVAS_PX, p + 0.5);
		ctx.stroke();
	}
	// face-zone overlay — the 12-grid face primitives land here regardless of
	// the body grid resolution. Helps the user keep solid B behind the face.
	// 12-grid: eyes at cols 3-4 / 7-8 row 3-4, mouth at cols 4-7 row 6.
	// Map to canvas pixels using the body grid block size.
	ctx.strokeStyle = "rgba(255,255,255,0.18)";
	ctx.setLineDash([4, 3]);
	const faceScale = g / 12;
	const fx = 3 * faceScale * block;
	const fy = 3 * faceScale * block;
	const fw = 6 * faceScale * block;
	const fh = 4 * faceScale * block;
	ctx.strokeRect(fx, fy, fw, fh);
	ctx.setLineDash([]);
}

function paintCell(clientX: number, clientY: number): void {
	const rect = painter.getBoundingClientRect();
	const x = clientX - rect.left;
	const y = clientY - rect.top;
	const block = CANVAS_PX / state.grid;
	const col = Math.floor(x / block);
	const row = Math.floor(y / block);
	if (col < 0 || col >= state.grid || row < 0 || row >= state.grid) return;
	if (state.cells[row][col] === state.tool) return;
	state.cells[row][col] = state.tool;
	drawPainter();
	updateJsonOut();
}

painter.addEventListener("pointerdown", (e) => {
	painting = true;
	painter.setPointerCapture(e.pointerId);
	paintCell(e.clientX, e.clientY);
});
painter.addEventListener("pointermove", (e) => {
	if (painting) paintCell(e.clientX, e.clientY);
});
painter.addEventListener("pointerup", (e) => {
	painting = false;
	painter.releasePointerCapture(e.pointerId);
});
painter.addEventListener("contextmenu", (e) => e.preventDefault());

// ── Tool palette ───────────────────────────────────────────────────────────
const toolsEl = document.getElementById("tools") as HTMLDivElement;
function renderTools(): void {
	toolsEl.innerHTML = "";
	for (const t of ROLES) {
		const btn = document.createElement("button");
		btn.className = `tool${t.role === state.tool ? " active" : ""}`;
		btn.title = t.role === "." ? "Erase (transparent)" : `${t.label} (${t.role})`;
		const sw = document.createElement("span");
		sw.className = "swatch";
		sw.style.background = t.role === "." ? "transparent" : (state.palette[t.key as keyof Palette] as string);
		if (t.role === ".") sw.style.background = "repeating-linear-gradient(45deg,#3a3a3c 0 4px,#2a2a2c 4px 8px)";
		btn.appendChild(sw);
		const lbl = document.createElement("span");
		lbl.textContent = `${t.role}  ${t.label}`;
		btn.appendChild(lbl);
		btn.addEventListener("click", () => {
			state.tool = t.role;
			renderTools();
		});
		toolsEl.appendChild(btn);
	}
}

// ── Palette inputs ─────────────────────────────────────────────────────────
const paletteEl = document.getElementById("palette") as HTMLDivElement;
function renderPalette(): void {
	paletteEl.innerHTML = "";
	for (const f of PALETTE_FIELDS) {
		const row = document.createElement("div");
		row.className = "palette-row";
		const label = document.createElement("label");
		label.htmlFor = `pal-${f}`;
		label.textContent = f;
		const input = document.createElement("input");
		input.type = "color";
		input.id = `pal-${f}`;
		input.value = state.palette[f];
		input.addEventListener("input", () => {
			state.palette[f] = input.value;
			drawPainter();
			renderTools();
			updatePreview();
			updateJsonOut();
		});
		row.appendChild(label);
		row.appendChild(input);
		paletteEl.appendChild(row);
	}
}

// ── Meta inputs ────────────────────────────────────────────────────────────
const idInput = document.getElementById("meta-id") as HTMLInputElement;
const nameInput = document.getElementById("meta-name") as HTMLInputElement;
const gridSelect = document.getElementById("meta-grid") as HTMLSelectElement;

function syncMetaInputs(): void {
	idInput.value = state.id;
	nameInput.value = state.name;
	gridSelect.value = String(state.grid);
}

idInput.addEventListener("input", () => {
	state.id = idInput.value;
	updateJsonOut();
});
nameInput.addEventListener("input", () => {
	state.name = nameInput.value;
	updateJsonOut();
});
gridSelect.addEventListener("change", () => {
	const newGrid = (gridSelect.value === "12" ? 12 : 24) as 12 | 24;
	if (newGrid === state.grid) return;
	// Resize cells: nearest-neighbour upscale/downscale. Preserve face zone if possible.
	const oldGrid = state.grid;
	const next = makeEmptyCells(newGrid);
	const ratio = oldGrid / newGrid;
	for (let row = 0; row < newGrid; row++) {
		for (let col = 0; col < newGrid; col++) {
			const sr = Math.min(oldGrid - 1, Math.floor(row * ratio));
			const sc = Math.min(oldGrid - 1, Math.floor(col * ratio));
			next[row][col] = state.cells[sr][sc];
		}
	}
	state.grid = newGrid;
	state.cells = next;
	drawPainter();
	updatePreview();
	updateJsonOut();
});

// ── Preview ────────────────────────────────────────────────────────────────
const previewImg = document.getElementById("preview") as HTMLImageElement;
let phase = 0;

function cellsToBase(): string[] {
	return state.cells.map((row) => row.join(""));
}

function buildPack(): CharacterPack {
	return {
		schema: 1,
		id: state.id || "mychar",
		name: state.name || "My Character",
		grid: state.grid,
		palette: { ...state.palette },
		base: cellsToBase(),
	};
}

function updatePreview(): void {
	previewImg.src = renderCharacter({
		pack: buildPack(),
		state: state.previewState,
		phase,
	});
}

setInterval(() => {
	phase = (phase + 0.02) % 1;
	updatePreview();
}, 50);

document.querySelectorAll<HTMLButtonElement>("button.state").forEach((b) => {
	b.addEventListener("click", () => {
		state.previewState = b.dataset.state as State["previewState"];
		document.querySelectorAll("button.state").forEach((x) => x.classList.remove("active"));
		b.classList.add("active");
		updatePreview();
	});
});

// ── JSON in/out ────────────────────────────────────────────────────────────
const jsonOut = document.getElementById("json-out") as HTMLTextAreaElement;
const jsonIn = document.getElementById("json-in") as HTMLTextAreaElement;
const status = document.getElementById("status") as HTMLElement;

function setStatus(msg: string, kind: "" | "ok" | "error" = ""): void {
	status.textContent = msg;
	status.className = kind;
}

function updateJsonOut(): void {
	jsonOut.value = JSON.stringify(buildPack(), null, 2);
}

(document.getElementById("load") as HTMLButtonElement).addEventListener("click", () => {
	let parsed: unknown;
	try {
		parsed = JSON.parse(jsonIn.value);
	} catch (e) {
		setStatus(`Not valid JSON: ${(e as Error).message}`, "error");
		return;
	}
	const v = validatePack(parsed);
	if (!v.ok) {
		setStatus(v.error, "error");
		return;
	}
	const pack = v.pack;
	state.id = pack.id;
	state.name = pack.name;
	state.grid = (pack.grid ?? 12) as 12 | 24;
	state.palette = { ...pack.palette };
	state.cells = pack.base.map((row) =>
		row.split("").map((ch) => {
			if ("BSHWDGLP".includes(ch)) return ch as Role;
			return "." as Role;
		}),
	);
	syncMetaInputs();
	renderPalette();
	renderTools();
	drawPainter();
	updatePreview();
	updateJsonOut();
	setStatus(`Loaded "${pack.id}".`, "ok");
});

(document.getElementById("reset") as HTMLButtonElement).addEventListener("click", () => {
	state.id = "mychar";
	state.name = "My Character";
	state.palette = { ...DEFAULT_PALETTE };
	state.cells = defaultBaseAt(state.grid);
	syncMetaInputs();
	renderPalette();
	renderTools();
	drawPainter();
	updatePreview();
	updateJsonOut();
	setStatus("Reset.", "ok");
});

(document.getElementById("copy") as HTMLButtonElement).addEventListener("click", async () => {
	try {
		await navigator.clipboard.writeText(jsonOut.value);
		setStatus("Copied to clipboard. Paste into Stream Deck → Import character…", "ok");
	} catch (e) {
		setStatus(`Copy failed: ${(e as Error).message}`, "error");
	}
});

// ── Boot ──────────────────────────────────────────────────────────────────
syncMetaInputs();
renderPalette();
renderTools();
drawPainter();
updatePreview();
updateJsonOut();
