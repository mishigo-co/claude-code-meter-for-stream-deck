import streamDeck, {
	action,
	type Action,
	type DidReceiveSettingsEvent,
	type JsonValue,
	type KeyDownEvent,
	type SendToPluginEvent,
	SingletonAction,
	type WillAppearEvent,
	type WillDisappearEvent,
} from "@elgato/streamdeck";

import { type CharacterPack, listCharacters, resolvePack, validatePack } from "../utils/characters.js";
import { fmtTokens, renderCharacter } from "../utils/renderCharacter.js";

type PiRequest =
	| { event: "list-characters" }
	| { event: "import-pack"; pack: unknown };

interface Settings {
	characterId?: string;
}

interface GlobalSettings {
	userPacks?: CharacterPack[];
}

type CharState = "idle" | "thinking" | "generating" | "success" | "sleeping";

@action({ UUID: "com.mishigo.context-meter.meter" })
export class ContextMeterAction extends SingletonAction<Settings> {
	private _action?: Action<Settings>;
	private timer?: ReturnType<typeof setInterval>;
	private phase = 0;
	private state: CharState = "idle";
	private tokens = 0;
	private lastUpdateAt = 0;
	private sleepTimer?: ReturnType<typeof setTimeout>;

	private characterId?: string;
	private userPacks: CharacterPack[] = [];
	private pack = resolvePack(undefined);

	/** Loads imported packs from global settings and keeps them in sync. */
	async loadGlobalSettings(): Promise<void> {
		streamDeck.settings.onDidReceiveGlobalSettings<GlobalSettings>((ev) => {
			this.userPacks = ev.settings.userPacks ?? [];
			this.refreshPack();
		});
		const global = await streamDeck.settings.getGlobalSettings<GlobalSettings>();
		this.userPacks = global.userPacks ?? [];
		this.refreshPack();
	}

	override onWillAppear(ev: WillAppearEvent<Settings>): void {
		this._action = ev.action;
		this.characterId = ev.payload.settings.characterId;
		this.refreshPack();
		this.state = "idle";
		if (!this.timer) {
			this.timer = setInterval(() => this.tick(), 50);
		}
	}

	override onWillDisappear(_ev: WillDisappearEvent<Settings>): void {
		clearInterval(this.timer);
		clearTimeout(this.sleepTimer);
		this.timer = undefined;
		this._action = undefined;
	}

	override onDidReceiveSettings(ev: DidReceiveSettingsEvent<Settings>): void {
		this.characterId = ev.payload.settings.characterId;
		this.refreshPack();
	}

	override onKeyDown(_ev: KeyDownEvent<Settings>): void {
		this.reset();
	}

	// ── Property-inspector RPC (v2 SDK: PI uses sendToPlugin / sendToPropertyInspector) ─

	override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, Settings>): Promise<void> {
		const req = ev.payload as PiRequest;
		if (req?.event === "list-characters") {
			await streamDeck.ui.sendToPropertyInspector({
				event: "characters",
				characters: this.characterList(),
			});
		} else if (req?.event === "import-pack") {
			const result = await this.importPack(req.pack);
			await streamDeck.ui.sendToPropertyInspector({
				event: "import",
				...result,
				characters: this.characterList(),
			});
		}
	}

	/** Returns the available characters (bundled ∪ imported) for the PI dropdown. */
	private characterList(): { id: string; name: string }[] {
		return listCharacters(this.userPacks);
	}

	/** Validates and persists an imported pack; returns the result for the PI reply. */
	private async importPack(
		body: unknown,
	): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
		const result = validatePack(body);
		if (!result.ok) return { ok: false, error: result.error };

		this.userPacks = [...this.userPacks.filter((p) => p.id !== result.pack.id), result.pack];
		await streamDeck.settings.setGlobalSettings<GlobalSettings>({ userPacks: this.userPacks });
		this.refreshPack();
		return { ok: true, id: result.pack.id };
	}

	// ── Animation state (driven by the HTTP server) ─────────────────────────────

	update(tokens: number, isThinking: boolean): void {
		clearTimeout(this.sleepTimer);
		this.tokens = tokens;
		this.lastUpdateAt = Date.now();
		this.state = isThinking ? "thinking" : "generating";
	}

	complete(tokens: number): void {
		clearTimeout(this.sleepTimer);
		this.tokens = tokens;
		this.state = "success";
		this.sleepTimer = setTimeout(() => {
			this.state = "sleeping";
			this.tokens = 0;
		}, 10_000);
	}

	reset(): void {
		clearTimeout(this.sleepTimer);
		this.tokens = 0;
		this.state = "idle";
	}

	private refreshPack(): void {
		this.pack = resolvePack(this.characterId, this.userPacks);
	}

	private tick(): void {
		this.phase = (this.phase + 0.02) % 1;

		// Auto-clear thinking if no update in 5s
		if (this.state === "thinking" && Date.now() - this.lastUpdateAt > 5_000) {
			this.state = "idle";
		}

		this._action?.setImage(
			renderCharacter({
				pack: this.pack,
				state: this.state,
				phase: this.phase,
				tokens: this.tokens > 0 ? this.tokens : undefined,
			}),
		);

		// Show token count as title when active
		if (this.state === "generating" || this.state === "success") {
			this._action?.setTitle(this.tokens > 0 ? fmtTokens(this.tokens) : "");
		} else {
			this._action?.setTitle("");
		}
	}
}
