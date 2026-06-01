// Property Inspector logic. Bundled to com.mishigo.context-meter.sdPlugin/ui/inspector.js
// (browser target) by tsup. Talks to the plugin via the SDK's fetch/route RPC.

import streamDeck from "@elgato/streamdeck";

interface Settings {
  characterId?: string;
}

type Character = { id: string; name: string };

const select = document.getElementById("character") as HTMLSelectElement;
const importBtn = document.getElementById("import-btn") as HTMLButtonElement;
const fileInput = document.getElementById("import-file") as HTMLInputElement;
const status = document.getElementById("status") as HTMLElement;

function setStatus(msg: string, kind: "" | "ok" | "error" = ""): void {
  status.textContent = msg;
  status.className = kind;
}

function populate(chars: Character[], selected?: string): void {
  select.innerHTML = "";
  for (const c of chars) {
    const opt = document.createElement("option");
    opt.value = c.id;
    opt.textContent = c.name;
    if (c.id === selected) opt.selected = true;
    select.appendChild(opt);
  }
}

streamDeck.onConnected(async () => {
  const settings = await streamDeck.settings.getSettings<Settings>();
  const res = await streamDeck.plugin.fetch<Character[]>("/characters");
  const chars = res.body ?? [];
  const selected = settings.characterId ?? chars[0]?.id;
  populate(chars, selected);

  // Persist the default selection so the plugin renders it on a fresh key.
  if (!settings.characterId && selected) {
    streamDeck.settings.setSettings<Settings>({ characterId: selected });
  }
});

select.addEventListener("change", () => {
  streamDeck.settings.setSettings<Settings>({ characterId: select.value });
  setStatus("");
});

importBtn.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  fileInput.value = ""; // allow re-importing the same filename later
  if (!file) return;

  let pack: unknown;
  try {
    pack = JSON.parse(await file.text());
  } catch {
    setStatus("That file is not valid JSON.", "error");
    return;
  }

  type ImportResult =
    | { ok: true; id: string; characters: Character[] }
    | { ok: false; error: string };
  const res = await streamDeck.plugin.fetch<ImportResult>("/import", pack as never);
  const body = res.body;

  if (body && body.ok) {
    populate(body.characters, body.id);
    streamDeck.settings.setSettings<Settings>({ characterId: body.id });
    setStatus(`Imported "${body.id}".`, "ok");
  } else {
    setStatus(body && !body.ok ? body.error : "Import failed.", "error");
  }
});
