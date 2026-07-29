---
links:
  '#823': https://github.com/fedify-dev/fedify/issues/823
  '#925': https://github.com/fedify-dev/fedify/pull/925
---
 -  Fixed the CommonJS Redis adapter build so it no longer requires
    `@js-temporal/polyfill` at runtime.  The build now bundles
    `temporal-polyfill`, while type declarations rely on the standard
    `esnext.temporal` lib reference.
    [[#823], [#925]]
