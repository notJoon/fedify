import {
  argument,
  command,
  constant,
  type InferValue,
  merge,
  message,
  object,
  string,
} from "@optique/core";
import { debugOption } from "./globals.ts";

export const tunnelCommand = command(
  "tunnel",
  merge(
    object({
      command: constant("tunnel"),
      resources: argument(string({ metavar: "PORT" })),
    }),
    debugOption,
  ),
  {
    description:
      message`Expose a local HTTP server to the public internet using a secure tunnel.`,
  },
);

export function runTunnel(
  command: InferValue<typeof tunnelCommand>,
) {
  console.debug(command);
}
