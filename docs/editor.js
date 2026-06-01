"use strict";
(() => {
  // src/utils/characters.ts
  var GRID = 12;
  var BLOCK = 6;
  var CANVAS = 72;
  var DEFAULT_ANCHORS = {
    eyeLeftX: 3,
    eyeRightX: 7,
    eyesY: 3,
    mouthX: 4,
    mouthY: 6
  };
  var LEGEND = {
    ".": null,
    " ": null,
    B: "body",
    S: "shade",
    H: "hilit",
    W: "white",
    D: "dark",
    G: "gray",
    L: "lgray",
    P: "pupil"
  };
  var PALETTE_ROLES = [
    "bg",
    "body",
    "shade",
    "hilit",
    "white",
    "pupil",
    "dark",
    "gray",
    "lgray"
  ];
  function renderGrid(base, pal, dyPx, gridSize = GRID) {
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
  var HEX = /^#[0-9a-fA-F]{6}$/;
  function validatePack(obj) {
    if (typeof obj !== "object" || obj === null) return { ok: false, error: "Not a JSON object" };
    const o = obj;
    if (o.schema !== 1) return { ok: false, error: "Unsupported schema (expected 1)" };
    if (typeof o.id !== "string" || !o.id.trim()) return { ok: false, error: 'Missing "id"' };
    if (typeof o.name !== "string" || !o.name.trim()) return { ok: false, error: 'Missing "name"' };
    const pal = o.palette;
    if (typeof pal !== "object" || pal === null) return { ok: false, error: 'Missing "palette"' };
    for (const role of PALETTE_ROLES) {
      const v = pal[role];
      if (typeof v !== "string" || !HEX.test(v)) {
        return { ok: false, error: `palette.${role} must be a #rrggbb hex colour` };
      }
    }
    const grid = o.grid === 24 ? 24 : 12;
    if (o.grid !== void 0 && o.grid !== 12 && o.grid !== 24) {
      return { ok: false, error: `"grid" must be 12 or 24` };
    }
    if (!Array.isArray(o.base) || o.base.length !== grid) {
      return { ok: false, error: `"base" must have ${grid} rows` };
    }
    for (let i = 0; i < grid; i++) {
      const r2 = o.base[i];
      if (typeof r2 !== "string" || r2.length !== grid) {
        return { ok: false, error: `base row ${i} must be ${grid} characters` };
      }
      for (const ch of r2) {
        if (!(ch in LEGEND)) return { ok: false, error: `base row ${i}: illegal character "${ch}"` };
      }
    }
    return { ok: true, pack: obj };
  }

  // src/utils/renderCharacter.ts
  function r(x, y, w, h, c) {
    return `<rect x="${x * BLOCK}" y="${y * BLOCK}" width="${w * BLOCK}" height="${h * BLOCK}" fill="${c}"/>`;
  }
  function hexToRgb(hex) {
    const n = parseInt(hex.slice(1), 16);
    return [n >> 16 & 255, n >> 8 & 255, n & 255];
  }
  function rgbToHex(r2, g2, b2) {
    const h = (v) => Math.round(v).toString(16).padStart(2, "0");
    return `#${h(r2)}${h(g2)}${h(b2)}`;
  }
  function rgbToHsl(r2, g2, b2) {
    r2 /= 255;
    g2 /= 255;
    b2 /= 255;
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
  function hslToRgb(h, s, l) {
    if (s === 0) return [l * 255, l * 255, l * 255];
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    const f = (t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    return [f(h + 1 / 3) * 255, f(h) * 255, f(h - 1 / 3) * 255];
  }
  function meterColor(p) {
    const [h, s] = rgbToHsl(...hexToRgb(p.body));
    if (s < 0.15) return "#33CCFF";
    return rgbToHex(...hslToRgb((h + 0.5) % 1, Math.max(s, 0.8), 0.6));
  }
  function eyesNormal(a, dy, p) {
    return r(a.eyeLeftX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeLeftX, dy + a.eyesY, 1, 1, p.pupil) + r(a.eyeRightX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeRightX + 1, dy + a.eyesY, 1, 1, p.pupil);
  }
  function eyesBlink(a, dy, p) {
    return r(a.eyeLeftX, dy + a.eyesY + 1, 2, 1, p.shade) + r(a.eyeRightX, dy + a.eyesY + 1, 2, 1, p.shade);
  }
  function eyesUp(a, dy, p) {
    return r(a.eyeLeftX, dy + a.eyesY - 1, 2, 2, p.white) + r(a.eyeLeftX + 1, dy + a.eyesY - 1, 1, 1, p.pupil) + r(a.eyeRightX, dy + a.eyesY - 1, 2, 2, p.white) + r(a.eyeRightX, dy + a.eyesY - 1, 1, 1, p.pupil);
  }
  function eyesClosed(a, dy, p) {
    return eyesBlink(a, dy, p);
  }
  function eyesWide(a, dy, p) {
    return r(a.eyeLeftX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeLeftX, dy + a.eyesY + 1, 1, 1, p.pupil) + r(a.eyeRightX, dy + a.eyesY, 2, 2, p.white) + r(a.eyeRightX + 1, dy + a.eyesY + 1, 1, 1, p.pupil) + r(a.eyeLeftX - 1, dy + a.eyesY - 1, 1, 1, p.hilit) + r(a.eyeRightX + 2, dy + a.eyesY - 1, 1, 1, p.hilit);
  }
  function mouthNeutral(a, dy, p) {
    return r(a.mouthX, dy + a.mouthY, 4, 1, p.shade);
  }
  function mouthSmile(a, dy, p) {
    return r(a.mouthX, dy + a.mouthY, 4, 1, p.shade) + r(a.mouthX - 1, dy + a.mouthY - 1, 1, 1, p.shade) + r(a.mouthX + 4, dy + a.mouthY - 1, 1, 1, p.shade);
  }
  function mouthOpen(a, dy, p) {
    return r(a.mouthX, dy + a.mouthY - 1, 4, 2, p.dark) + r(a.mouthX + 1, dy + a.mouthY, 2, 1, p.gray);
  }
  function mouthSleep(a, dy, p) {
    return r(a.mouthX + 1, dy + a.mouthY, 2, 1, p.shade);
  }
  function thinkingDots(phase2, p) {
    let s = "";
    const dots = [3, 5, 7];
    for (let i = 0; i < 3; i++) {
      const bounce = Math.sin(phase2 * Math.PI * 2 - i * 0.8) > 0.3 ? -1 : 0;
      s += r(dots[i], 11 + bounce, 2, 1, p.hilit);
    }
    return s;
  }
  function zzzBubbles(phase2, p) {
    let s = "";
    const drift = Math.floor(phase2 * 4) % 4;
    const y1 = Math.max(0, 3 - drift);
    s += r(9, y1, 2, 1, p.lgray) + r(10, y1 + 1, 1, 1, p.lgray) + r(9, y1 + 2, 2, 1, p.lgray);
    if (drift < 2) {
      const y2 = Math.max(0, 1 - Math.floor(drift / 2));
      s += r(10, y2, 1, 1, p.gray) + r(10, y2 + 1, 1, 1, p.gray);
    }
    return s;
  }
  function successSparks(phase2, p) {
    let s = "";
    const on = Math.sin(phase2 * Math.PI * 4) > 0;
    if (on) {
      s += r(0, 2, 1, 1, p.hilit) + r(11, 3, 1, 1, p.hilit);
      s += r(1, 0, 1, 1, p.hilit) + r(10, 1, 1, 1, p.hilit);
    } else {
      s += r(1, 1, 1, 1, p.hilit) + r(10, 2, 1, 1, p.hilit);
      s += r(0, 3, 1, 1, p.hilit) + r(11, 0, 1, 1, p.hilit);
    }
    return s;
  }
  function generatingBars(phase2, p) {
    const len = [2, 3, 1, 2];
    let s = "";
    for (let i = 0; i < 4; i++) {
      const active = Math.floor(phase2 * 4) === i;
      s += r(2 + i * 2, 11, len[i] + (active ? 1 : 0), 1, active ? p.hilit : p.shade);
    }
    return s;
  }
  function renderCharacter(opts) {
    const { pack, state: state2, phase: phase2 } = opts;
    const p = pack.palette;
    const a = { ...DEFAULT_ANCHORS, ...pack.anchors };
    const bob = Math.round(Math.sin(phase2 * Math.PI * 2) * 0.7);
    const blink = phase2 > 0.88 && phase2 < 0.95;
    const body = renderGrid(pack.base, p, bob * BLOCK, pack.grid ?? 12);
    let face = "";
    let extras = "";
    switch (state2) {
      case "idle":
        face = (blink ? eyesBlink(a, bob, p) : eyesNormal(a, bob, p)) + mouthNeutral(a, bob, p);
        break;
      case "thinking":
        face = eyesUp(a, bob, p) + mouthNeutral(a, bob, p);
        extras = thinkingDots(phase2, p);
        break;
      case "generating":
        face = (blink ? eyesBlink(a, bob, p) : eyesNormal(a, bob, p)) + mouthOpen(a, bob, p);
        extras = generatingBars(phase2, p);
        break;
      case "success":
        face = eyesWide(a, bob, p) + mouthSmile(a, bob, p);
        extras = successSparks(phase2, p);
        break;
      case "sleeping":
        face = eyesClosed(a, bob, p) + mouthSleep(a, bob, p);
        extras = zzzBubbles(phase2, p);
        break;
    }
    let tokenBar = "";
    if (opts.tokens !== void 0 && opts.tokens > 0) {
      const pct = Math.min(1, opts.tokens / 2e5);
      const filled = Math.round(pct * GRID);
      if (filled > 0) tokenBar += `<rect x="0" y="70" width="${filled * BLOCK}" height="2" fill="${meterColor(p)}"/>`;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="72" height="72"><rect width="72" height="72" fill="${p.bg}"/>` + body + face + extras + tokenBar + `</svg>`;
    return `data:image/svg+xml;base64,${btoa(svg)}`;
  }

  // src/editor/main.ts
  var ROLES = [
    { role: "B", key: "body", label: "Body" },
    { role: "S", key: "shade", label: "Shade" },
    { role: "H", key: "hilit", label: "Hilit" },
    { role: "L", key: "lgray", label: "L-gray" },
    { role: "G", key: "gray", label: "Gray" },
    { role: "D", key: "dark", label: "Dark" },
    { role: "W", key: "white", label: "White" },
    { role: "P", key: "pupil", label: "Pupil" },
    { role: ".", key: "transparent", label: "Erase" }
  ];
  var PALETTE_FIELDS = [
    "bg",
    "body",
    "shade",
    "hilit",
    "lgray",
    "gray",
    "dark",
    "white",
    "pupil"
  ];
  var DEFAULT_PALETTE = {
    bg: "#000000",
    body: "#4DABF5",
    shade: "#1F5F8C",
    hilit: "#A8DAFF",
    white: "#FFFFFF",
    pupil: "#0A1929",
    dark: "#0E2E4A",
    gray: "#3C7AAB",
    lgray: "#C9E4F8"
  };
  var CANVAS_PX = 480;
  function makeEmptyCells(grid) {
    return Array.from({ length: grid }, () => Array.from({ length: grid }, () => "."));
  }
  function defaultBaseAt(grid) {
    const cells = makeEmptyCells(grid);
    const cx = (grid - 1) / 2;
    const cy = (grid - 1) / 2;
    const r2 = grid === 12 ? 4.5 : 9.5;
    for (let row = 0; row < grid; row++) {
      for (let col = 0; col < grid; col++) {
        const d = Math.hypot(col - cx, row - cy);
        if (d <= r2 * 0.9) cells[row][col] = "B";
        else if (d <= r2) cells[row][col] = "S";
      }
    }
    return cells;
  }
  var state = {
    id: "mychar",
    name: "My Character",
    grid: 24,
    palette: { ...DEFAULT_PALETTE },
    cells: defaultBaseAt(24),
    tool: "B",
    previewState: "idle"
  };
  var painter = document.getElementById("painter");
  var ctx = painter.getContext("2d");
  var painting = false;
  function roleColor(r2) {
    if (r2 === ".") return null;
    const map = {
      B: "body",
      S: "shade",
      H: "hilit",
      W: "white",
      D: "dark",
      G: "gray",
      L: "lgray",
      P: "pupil"
    };
    return state.palette[map[r2]];
  }
  function drawPainter() {
    const g = state.grid;
    const block = CANVAS_PX / g;
    ctx.clearRect(0, 0, CANVAS_PX, CANVAS_PX);
    for (let row = 0; row < g; row++) {
      for (let col = 0; col < g; col++) {
        const c = roleColor(state.cells[row][col]);
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(col * block, row * block, block, block);
      }
    }
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
  function paintCell(clientX, clientY) {
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
  var toolsEl = document.getElementById("tools");
  function renderTools() {
    toolsEl.innerHTML = "";
    for (const t of ROLES) {
      const btn = document.createElement("button");
      btn.className = `tool${t.role === state.tool ? " active" : ""}`;
      btn.title = t.role === "." ? "Erase (transparent)" : `${t.label} (${t.role})`;
      const sw = document.createElement("span");
      sw.className = "swatch";
      sw.style.background = t.role === "." ? "transparent" : state.palette[t.key];
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
  var paletteEl = document.getElementById("palette");
  function renderPalette() {
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
  var idInput = document.getElementById("meta-id");
  var nameInput = document.getElementById("meta-name");
  var gridSelect = document.getElementById("meta-grid");
  function syncMetaInputs() {
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
    const newGrid = gridSelect.value === "12" ? 12 : 24;
    if (newGrid === state.grid) return;
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
  var previewImg = document.getElementById("preview");
  var phase = 0;
  function cellsToBase() {
    return state.cells.map((row) => row.join(""));
  }
  function buildPack() {
    return {
      schema: 1,
      id: state.id || "mychar",
      name: state.name || "My Character",
      grid: state.grid,
      palette: { ...state.palette },
      base: cellsToBase()
    };
  }
  function updatePreview() {
    previewImg.src = renderCharacter({
      pack: buildPack(),
      state: state.previewState,
      phase
    });
  }
  setInterval(() => {
    phase = (phase + 0.02) % 1;
    updatePreview();
  }, 50);
  document.querySelectorAll("button.state").forEach((b) => {
    b.addEventListener("click", () => {
      state.previewState = b.dataset.state;
      document.querySelectorAll("button.state").forEach((x) => x.classList.remove("active"));
      b.classList.add("active");
      updatePreview();
    });
  });
  var jsonOut = document.getElementById("json-out");
  var jsonIn = document.getElementById("json-in");
  var status = document.getElementById("status");
  function setStatus(msg, kind = "") {
    status.textContent = msg;
    status.className = kind;
  }
  function updateJsonOut() {
    jsonOut.value = JSON.stringify(buildPack(), null, 2);
  }
  document.getElementById("load").addEventListener("click", () => {
    let parsed;
    try {
      parsed = JSON.parse(jsonIn.value);
    } catch (e) {
      setStatus(`Not valid JSON: ${e.message}`, "error");
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
    state.grid = pack.grid ?? 12;
    state.palette = { ...pack.palette };
    state.cells = pack.base.map(
      (row) => row.split("").map((ch) => {
        if ("BSHWDGLP".includes(ch)) return ch;
        return ".";
      })
    );
    syncMetaInputs();
    renderPalette();
    renderTools();
    drawPainter();
    updatePreview();
    updateJsonOut();
    setStatus(`Loaded "${pack.id}".`, "ok");
  });
  document.getElementById("reset").addEventListener("click", () => {
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
  document.getElementById("copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(jsonOut.value);
      setStatus("Copied to clipboard. Paste into Stream Deck \u2192 Import character\u2026", "ok");
    } catch (e) {
      setStatus(`Copy failed: ${e.message}`, "error");
    }
  });
  syncMetaInputs();
  renderPalette();
  renderTools();
  drawPainter();
  updatePreview();
  updateJsonOut();
})();
