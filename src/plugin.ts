import streamDeck from "@elgato/streamdeck";
import { ClaudeMeterAction } from "./actions/claude-meter.js";
import { startServer } from "./server.js";

const meter = new ClaudeMeterAction();

startServer(3141, (update) => {
  if (update.reset) {
    meter.reset();
  } else if (update.complete) {
    meter.complete(update.tokens ?? 0);
  } else {
    meter.update(update.tokens ?? 0, update.isThinking ?? false);
  }
});

streamDeck.actions.registerAction(meter);

// Property-inspector RPC: list characters and import new packs.
streamDeck.ui.registerRoute("/characters", () => meter.characterList());
streamDeck.ui.registerRoute("/import", (req) => meter.importPack(req.body));

streamDeck.connect().then(() => meter.loadGlobalSettings());
