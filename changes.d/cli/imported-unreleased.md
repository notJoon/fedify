---
links:
  '#823': https://github.com/fedify-dev/fedify/issues/823
  '#925': https://github.com/fedify-dev/fedify/pull/925
  '#940': https://github.com/fedify-dev/fedify/pull/940
---
 -  Added `fedify.com.es` as a tunneling service.  The CLI pins the service's
    SSH host key and rejects a mismatched server before exposing a local port.
    [[#940]]
 -  Removed `localhost.run` as a tunneling service.  The service is no longer
    available, and the CLI now rejects attempts to use it.
    [[#940]]
 -  Switched the CLI's Temporal runtime dependency from
    `@js-temporal/polyfill` to `temporal-polyfill`.
    [[#823], [#925]]
