import { action, Action, KeyDownEvent, SingletonAction, WillAppearEvent, WillDisappearEvent } from "@elgato/streamdeck";
import { renderFrame } from "../utils/render.js";

interface Settings {
  maxTokens?: number;
}

@action({ UUID: "com.mishigo.claude-meter.meter" })
export class ClaudeMeterAction extends SingletonAction<Settings> {
  private _action?: Action<Settings>;
  private timer?: ReturnType<typeof setInterval>;
  private phase = 0;
  private tokens = 0;
  private maxTokens = 200_000;
  private isThinking = false;
  private lastUpdateAt = 0;

  override onWillAppear(ev: WillAppearEvent<Settings>): void {
    this._action = ev.action;
    this.maxTokens = ev.payload.settings.maxTokens ?? 200_000;
    if (!this.timer) {
      this.timer = setInterval(() => this.tick(), 50);
    }
  }

  override onWillDisappear(_ev: WillDisappearEvent<Settings>): void {
    clearInterval(this.timer);
    this.timer = undefined;
  }

  override onKeyDown(_ev: KeyDownEvent<Settings>): void {
    this.tokens = 0;
    this.isThinking = false;
  }

  update(tokens: number, isThinking: boolean): void {
    this.tokens = tokens;
    this.isThinking = isThinking;
    this.lastUpdateAt = Date.now();
  }

  reset(): void {
    this.tokens = 0;
    this.isThinking = false;
  }

  private tick(): void {
    this.phase = (this.phase + 0.02) % 1;
    if (this.isThinking && Date.now() - this.lastUpdateAt > 5_000) {
      this.isThinking = false;
    }
    const pct = Math.min(100, (this.tokens / this.maxTokens) * 100);
    this._action?.setImage(renderFrame({
      percentage: pct,
      phase: this.phase,
      isThinking: this.isThinking,
      tokens: this.tokens > 0 ? this.tokens : undefined,
    }));
  }
}
