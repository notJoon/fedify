import { or } from "@optique/core";
import { run } from "@optique/run";
import { lookupCommand, runLookup } from "./lookup.ts";
import { runWebFinger, webFingerCommand } from "./webfinger.ts";
import { initCommand, runInit } from "./init.ts";
import { inboxCommand, runInbox } from "./inbox.ts";
import { nodeInfoCommand, runNodeInfo } from "./nodeinfo.ts";
import { runTunnel, tunnelCommand } from "./tunnel.ts";
import { configureLogging } from "./globals.ts";

const command = or(
  initCommand,
  webFingerCommand,
  lookupCommand,
  inboxCommand,
  nodeInfoCommand,
  tunnelCommand,
);

async function main() {
  const result = run(command, {
    programName: "fedify",
    help: "both",
  });

  if (result.debug) {
    await configureLogging();
  }
  if (result.command === "init") {
    runInit(result);
  }
  if (result.command === "lookup") {
    await runLookup(result);
  }
  if (result.command === "webfinger") {
    runWebFinger(result);
  }
  if (result.command === "inbox") {
    runInbox(result);
  }
  if (result.command === "nodeinfo") {
    runNodeInfo(result);
  }
  if (result.command === "tunnel") {
    runTunnel(result);
  }
}

await main();
