<!-- deno-fmt-ignore-file -->

@fedify/next: Integrate Fedify with Next.js
===========================================

[![Follow @fedify@hollo.social][@fedify@hollo.social badge]][@fedify@hollo.social]

This package provides a simple way to integrate [Fedify] with [Next.js].

> [!IMPORTANT]
> We recommend initializing your app using the `init` command of the
> [Fedify CLI] rather than installing this package directly.

> [!IMPORTANT]
> This package runs Next.js middleware on the Node.js runtime.
> Therefore, you must use version 15.5 or later, or at least 15.4 canary.
> For more details, refer to the [official documentation of `middleware`].

[@fedify@hollo.social badge]: https://fedi-badge.deno.dev/@fedify@hollo.social/followers.svg
[@fedify@hollo.social]: https://hollo.social/@fedify
[Fedify]: https://fedify.dev/
[Next.js]: https://nextjs.org/
[Fedify CLI]: https://www.npmjs.com/package/@fedify/cli
[official documentation of `middleware`]: https://nextjs.org/docs/app/api-reference/file-conventions/middleware#runtime


Usage
-----

~~~~ typescript
// --- middleware.ts ---
import { fedifyWith } from "@fedify/next";
import { federation } from "./federation";

export default fedifyWith(federation)();

// This config must be defined on `middleware.ts`.
export const config = {
  runtime: "nodejs",
  matcher: [
    {
      source: "/:path*",
      has: [
        {
          type: "header",
          key: "Accept",
          value: ".*application\\/((jrd|activity|ld)\\+json|xrd\\+xml).*",
        },
      ],
    },
    {
      source: "/:path*",
      has: [
        {
          type: "header",
          key: "content-type",
          value: ".*application\\/((jrd|activity|ld)\\+json|xrd\\+xml).*",
        },
      ],
    },
    { source: "/.well-known/nodeinfo" },
    { source: "/.well-known/x-nodeinfo2" },
  ],
};
~~~~
