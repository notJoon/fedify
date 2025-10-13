import {
  argument,
  choice,
  command,
  constant,
  type InferValue,
  message,
  object,
  option,
  optional,
  optionNames,
} from "@optique/core";
import { path } from "@optique/run";
import {
  KV_STORE,
  MESSAGE_QUEUE,
  PACKAGE_MANAGER,
  WEB_FRAMEWORK,
} from "./const.ts";
import { debugOption } from "../globals.ts";

const webFramework = optional(option(
  "-w",
  "--web-framework",
  choice(WEB_FRAMEWORK, { metavar: "WEB_FRAMEWORK" }),
  {
    description: message`The web framework to integrate Fedify with.`,
  },
));
const packageManager = optional(option(
  "-p",
  "--package-manager",
  choice(PACKAGE_MANAGER, { metavar: "PACKAGE_MANAGER" }),
  {
    description:
      message`The package manager to use for installing dependencies.`,
  },
));
const kvStore = optional(option(
  "-k",
  "--kv-store",
  choice(KV_STORE, { metavar: "KV_STORE" }),
  {
    description:
      message`The key-value store to use for caching and some other features.`,
  },
));
const messageQueue = optional(option(
  "-m",
  "--message-queue",
  choice(MESSAGE_QUEUE, { metavar: "MESSAGE_QUEUE" }),
  {
    description: message`The message queue to use for background tasks.`,
  },
));

export const initCommand = command(
  "init",
  object("Initialization options", {
    command: constant("init"),
    dir: optional(argument(path({ metavar: "DIR" }), {
      description:
        message`The project directory to initialize.  If a specified directory does not exist, it will be created.`,
    })),
    webFramework,
    packageManager,
    kvStore,
    messageQueue,
    dryRun: option("-d", "--dry-run", {
      description: message`Perform a trial run with no changes made.`,
    }),
    debugOption,
  }),
  {
    brief: message`Initialize a new Fedify project directory.`,
    description: message`Initialize a new Fedify project directory.

By default, it initializes the current directory.  You can specify a different directory as an argument.

Unless you specify all options (${optionNames(["-w", "--web-framework"])}, ${
      optionNames(["-p", "--package-manager"])
    }, ${optionNames(["-k", "--kv-store"])}, and ${
      optionNames(["-m", "--message-queue"])
    }), it will prompt you to select the options interactively.`,
  },
);

export type InitCommand = InferValue<typeof initCommand>;
