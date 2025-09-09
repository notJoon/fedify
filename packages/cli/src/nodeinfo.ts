import { createJimp } from "@jimp/core";
import webp from "@jimp/wasm-webp";
import {
  argument,
  command as Command,
  constant,
  flag,
  type InferValue,
  merge,
  message,
  object,
  option,
  optional,
  or,
  string,
  withDefault,
} from "@optique/core";
import { url } from "@optique/core/valueparser";
import { print } from "@optique/run";
import { defaultFormats, defaultPlugins } from "jimp";
import { debugOption } from "./globals.ts";

export const Jimp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

const nodeInfoOption = optional(
  or(
    object({
      raw: flag("-r", "--raw", {
        description: message`Show NodeInfo document in the raw JSON format`,
      }),
    }),
    object({
      bestEffort: optional(flag("-b", "--best-effort", {
        description:
          message`Parse the NodeInfo document with best effort. If the NodeInfo document is not well-formed, the option will try to parse it as much as possible.`,
      })),
      noFavicon: optional(flag("--no-favicon", {
        description: message`Disable fetching the favicon of the instance`,
      })),
      metadata: optional(flag("-m", "--metadata", {
        description:
          message`show the extra metadata of the NodeInfo, i.e., the metadata field of the document.`,
      })),
    }),
  ),
);

const userAgentOption = optional(object({
  userAgent: option("-u", "--user-agent", string()),
}));

export const nodeInfoCommand = Command(
  "nodeinfo",
  merge(
    object({
      command: constant("nodeinfo"),
      host: argument(string({ metavar: "hostname or URL" }), {
        description: message`Bare hostname or a full URL of the instance`,
      }),
    }),
    debugOption,
    nodeInfoOption,
    userAgentOption,
  ),
  {
    description:
      message`Get information about a remote node using the NodeInfo protocol. The argument is the hostname of the remote node, or the URL of the remote node.`,
  },
);

export function runNodeInfo(
  command: InferValue<typeof nodeInfoCommand>,
) {
  console.debug(command);
}
