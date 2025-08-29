import { fedifyHook } from "@fedify/sveltekit";
import federation from "./lib/federation";
import { sequence } from "@sveltejs/kit/hooks";
import { replaceHost } from "./lib/handles";
import type { Handle } from "@sveltejs/kit";

export const handle = sequence(
  replaceHost,
  fedifyHook(federation, () => {}) as unknown as Handle,
);
