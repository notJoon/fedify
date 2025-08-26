/**
 * Fedify with SvelteKit
 * =====================
 *
 * This module provides a [SvelteKit] hook to integrate with the Fedify.
 *
 * [SvelteKit]: https://kit.svelte.dev/
 *
 * @deprecated This module has been moved to a separate package.
 *             Install and import from `@fedify/sveltekit` instead.
 *             This module will be removed in Fedify v2.0.
 *
 * @module
 * @since 1.3.0
 */
import { getLogger } from "@logtape/logtape";
import type {
  Federation,
  FederationFetchOptions,
} from "../federation/federation.ts";

type RequestEvent = {
  request: Request;
};

type HookParams = {
  event: RequestEvent;
  resolve: (event: RequestEvent) => Promise<Response>;
};

/**
 * Create a SvelteKit hook handler to integrate with the {@link Federation}
 * object.
 *
 * @deprecated This function has been moved to `@fedify/sveltekit` package.
 *             Import `fedifyHook` from `@fedify/sveltekit` instead.
 *             This function will be removed in Fedify v2.0.
 *
 * @example hooks.server.ts
 * ``` typescript
 * import { federation } from "./federation"; // Import the `Federation` object
 *
 * export const handle = fedifyHook(federation, () => undefined);
 * ```
 *
 * @template TContextData A type of the context data for the {@link Federation}
 *                         object.
 * @param federation A {@link Federation} object to integrate with SvelteKit.
 * @param createContextData A function to create a context data for the
 *                          {@link Federation} object.
 * @returns A SvelteKit hook handler.
 * @since 1.3.0
 */
export function fedifyHook<TContextData>(
  federation: Federation<TContextData>,
  createContextData: (
    event: RequestEvent,
  ) => TContextData | Promise<TContextData>,
): (params: HookParams) => Promise<Response> {
  const logger = getLogger(["fedify", "federation", "sveltekit"]);
  logger.warn(
    "The `@fedify/fedify/x/sveltekit` module is deprecated; use `fedifyHook` " +
      "from `@fedify/sveltekit` package instead.",
  );
  return async ({ event, resolve }: HookParams) => {
    return await federation.fetch(event.request, {
      contextData: await createContextData(event),
      ...integrateFetchOptions({ event, resolve }),
    });
  };
}

function integrateFetchOptions(
  { event, resolve }: HookParams,
): Omit<FederationFetchOptions<void>, "contextData"> {
  return {
    async onNotFound(): Promise<Response> {
      return await resolve(event);
    },

    // Similar to `onNotFound`, but slightly more tricky one.
    // When the `federation` object finds a request not acceptable type-wise
    // (i.e., a user-agent doesn't want JSON-LD), it will call the `resolve`
    // provided by the SvelteKit framework so that it renders HTML if there's some
    // page.  Otherwise, it will simply return a 406 Not Acceptable response.
    // This kind of trick enables the Fedify and SvelteKit to share the same routes
    // and they do content negotiation depending on `Accept` header:
    async onNotAcceptable(): Promise<Response> {
      const res = await resolve(event);
      if (res.status !== 404) return res;
      return new Response("Not acceptable", {
        status: 406,
        headers: {
          "Content-Type": "text/plain",
          Vary: "Accept",
        },
      });
    },
  };
}
