import { fedifyWith } from "@fedify/next";
import federation from "@/federation";
import { replaceHost } from "./lib/utils";

export default replaceHost(
  fedifyWith(federation)(
    /*
      function(request: Request){
        // Add any additional middleware here
        return NextResponse.next()
      }
    */
  ),
);

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
