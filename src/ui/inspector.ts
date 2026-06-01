// Property Inspector — talks to the plugin over the Stream Deck PI WebSocket
// protocol directly. The v2 @elgato/streamdeck package no longer ships a
// browser export, but the underlying protocol (defined by the Stream Deck app
// itself) is unchanged: register on connect, then exchange getSettings /
// setSettings / sendToPlugin / didReceiveSettings / sendToPropertyInspector
// events.

interface Settings {
	characterId?: string;
}

type Character = { id: string; name: string };

type PluginMessage =
	| { event: "characters"; characters: Character[] }
	| { event: "import"; ok: true; id: string; characters: Character[] }
	| { event: "import"; ok: false; error: string; characters: Character[] };

const select = document.getElementById("character") as HTMLSelectElement;
const importBtn = document.getElementById("import-btn") as HTMLButtonElement;
const pasteArea = document.getElementById("paste-area") as HTMLDivElement;
const pasteText = document.getElementById("paste-text") as HTMLTextAreaElement;
const pasteImport = document.getElementById("paste-import") as HTMLButtonElement;
const pasteCancel = document.getElementById("paste-cancel") as HTMLButtonElement;
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

// Stream Deck PI socket state — populated by connectElgatoStreamDeckSocket.
let ws: WebSocket | null = null;
let piUuid = "";
let actionUuid = "";
let settings: Settings = {};
let characters: Character[] = [];

function wsSend(event: string, extra: Record<string, unknown> = {}): void {
	ws?.send(JSON.stringify({ event, context: piUuid, ...extra }));
}

function setSettings(next: Settings): void {
	settings = next;
	wsSend("setSettings", { payload: next });
}

function sendToPlugin(payload: unknown): void {
	wsSend("sendToPlugin", { action: actionUuid, payload });
}

function applyCharacterList(): void {
	const selected = settings.characterId ?? characters[0]?.id;
	populate(characters, selected);
	// Persist the default selection so the plugin renders it on a fresh key.
	if (!settings.characterId && selected) setSettings({ characterId: selected });
}

function handlePluginMessage(msg: PluginMessage): void {
	if (msg.event === "characters") {
		characters = msg.characters;
		applyCharacterList();
	} else if (msg.event === "import") {
		characters = msg.characters;
		if (msg.ok) {
			populate(characters, msg.id);
			setSettings({ characterId: msg.id });
			setStatus(`Imported "${msg.id}".`, "ok");
			pasteArea.classList.remove("open");
			pasteText.value = "";
		} else {
			setStatus(msg.error, "error");
		}
	}
}

// Stream Deck calls this global on PI load.
(globalThis as unknown as {
	connectElgatoStreamDeckSocket: (
		port: number,
		uuid: string,
		registerEvent: string,
		info: string,
		actionInfoJson: string,
	) => void;
}).connectElgatoStreamDeckSocket = (port, uuid, registerEvent, _info, actionInfoJson) => {
	piUuid = uuid;
	try {
		actionUuid = JSON.parse(actionInfoJson).action ?? "";
	} catch {
		actionUuid = "";
	}

	ws = new WebSocket(`ws://127.0.0.1:${port}`);
	ws.addEventListener("open", () => {
		ws?.send(JSON.stringify({ event: registerEvent, uuid }));
		wsSend("getSettings");
		sendToPlugin({ event: "list-characters" });
	});
	ws.addEventListener("message", (e) => {
		let data: { event?: string; payload?: unknown };
		try {
			data = JSON.parse(e.data);
		} catch {
			return;
		}
		if (data.event === "didReceiveSettings") {
			const p = data.payload as { settings?: Settings } | undefined;
			settings = p?.settings ?? {};
			if (characters.length) applyCharacterList();
		} else if (data.event === "sendToPropertyInspector") {
			handlePluginMessage(data.payload as PluginMessage);
		}
	});
};

select.addEventListener("change", () => {
	setSettings({ characterId: select.value });
	setStatus("");
});

// Stream Deck's PI webview can't reliably read user-picked files on macOS, so
// imports go through a paste-the-JSON textarea instead.
importBtn.addEventListener("click", () => {
	pasteArea.classList.add("open");
	pasteText.focus();
	setStatus("");
});

pasteCancel.addEventListener("click", () => {
	pasteArea.classList.remove("open");
	pasteText.value = "";
	setStatus("");
});

pasteImport.addEventListener("click", () => {
	const text = pasteText.value.trim();
	if (!text) {
		setStatus("Paste a character-pack JSON first.", "error");
		return;
	}
	let pack: unknown;
	try {
		pack = JSON.parse(text);
	} catch (e) {
		setStatus(`Not valid JSON: ${(e as Error).message}`, "error");
		return;
	}
	sendToPlugin({ event: "import-pack", pack });
});
