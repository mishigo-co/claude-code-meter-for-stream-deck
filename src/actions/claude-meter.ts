import { action, Action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { renderCharacter, fmtTokens } from "../utils/renderCharacter.js";

interface Settings {}

type CharState = "idle" | "thinking" | "generating" | "success" | "sleeping";

@action({ UUID: "com.mishigo.claude-meter.meter" })
export class ClaudeMeterAction extends SingletonAction<Settings> {
  private _action?: Action<Settings>;
  private timer?: ReturnType<typeof setInterval>;
  private phase = 0;
  private state: CharState = "idle";
  private tokens = 0;
  private lastUpdateAt = 0;
  private sleepTimer?: ReturnType<typeof setTimeout>;

  override onWillAppear(ev: WillAppearEvent<Settings>): void {
    this._action = ev.action;
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

  override onKeyDown(_ev: KeyDownEvent<Settings>): void {
    this.reset();
  }

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

  private tick(): void {
    this.phase = (this.phase + 0.02) % 1;

    // Auto-clear thinking if no update in 5s
    if (this.state === "thinking" && Date.now() - this.lastUpdateAt > 5_000) {
      this.state = "idle";
    }

    this._action?.setImage(renderCharacter({
      state: this.state,
      phase: this.phase,
      tokens: this.tokens > 0 ? this.tokens : undefined,
    }));

    // Show token count as title when active
    if (this.state === "generating" || this.state === "success") {
      this._action?.setTitle(this.tokens > 0 ? fmtTokens(this.tokens) : "");
    } else {
      this._action?.setTitle("");
    }
  }
}
