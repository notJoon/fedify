import { getXForwardedRequest } from "x-forwarded-fetch";

/**
 * Replaces the host of the request with the value of the
 * x-forwarded-host header, if present.
 * If don't use proxy or tunnel, this wrapper is unnecessary.
 * @param handler The request handler to wrap.
 * @return A new request handler with the host replaced.
 */
export const replaceHost =
  (handler: (request: Request) => unknown) => (request: Request) =>
    getXForwardedRequest(request).then(handler);
