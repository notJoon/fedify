import { getXForwardedRequest } from "x-forwarded-fetch";
import { hasFederationAcceptHeader, integrateFederation } from "@fedify/next";
import federation from "~/federation";

export default async function (request: Request) {
  console.log(request);
  if (hasFederationAcceptHeader(request)) {
    const req = await getXForwardedRequest(request);
    return integrateFederation(federation)(req);
  }
}

// This config makes middleware process only requests with the
// "Accept" header matching the federation accept regex.
// More details: https://nextjs.org/docs/app/api-reference/file-conventions/middleware#config-object-optional.
export const config = {
  runtime: "nodejs",
  matcher: [{
    source: "/:path*",
    has: [{
      type: "header",
      key: "Accept",
      value: ".*application\\/((jrd|activity|ld)\\+json|xrd\\+xml).*",
    }],
  }],
};
