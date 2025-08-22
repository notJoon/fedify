/**
 * Replaces the host of the request with the value of the
 * x-forwarded-host header, if present.
 * If don't use proxy or tunnel, this wrapper is unnecessary.
 * @param handler The request handler to wrap.
 * @return A new request handler with the host replaced.
 */
export function replaceHost(handler: (request: Request) => unknown) {
  return (request: Request) => {
    const forwardedHost = request.headers.get("x-forwarded-host");
    if (!forwardedHost) return handler(request);
    const headers = new Headers(request.headers);
    headers.append("host", forwardedHost);
    const url = new URL(request.url);
    url.host = forwardedHost;
    url.port = "";
    return handler(new Request(url, { ...request, headers }));
  };
}
