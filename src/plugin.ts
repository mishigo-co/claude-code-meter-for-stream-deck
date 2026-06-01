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
streamDeck.connect();
