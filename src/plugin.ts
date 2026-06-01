import streamDeck from "@elgato/streamdeck";

import { ContextMeterAction } from "./actions/meter.js";
import { startServer } from "./server.js";

const meter = new ContextMeterAction();

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

// Property-inspector RPC is wired in ContextMeterAction.onSendToPlugin.

streamDeck.connect().then(() => meter.loadGlobalSettings());
