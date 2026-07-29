---
links:
  '#823': https://github.com/fedify-dev/fedify/issues/823
  '#925': https://github.com/fedify-dev/fedify/pull/925
  '#930': https://github.com/fedify-dev/fedify/issues/930
  '#934': https://github.com/fedify-dev/fedify/pull/934
---
 -  Added `PostgresKvStore.cas()`, including atomic creation, replacement, and
    deletion with TTL-aware comparison.  This allows PostgreSQL-backed stores,
    including Netlify Database, to enforce queue ordering and other Fedify CAS
    operations.
    [[#930], [#934]]
 -  `PostgresKvStore` now creates crash-safe logged tables by default and
    migrates existing unlogged tables during initialization.  Transient
    unlogged storage remains available with the `unlogged` option.  The
    one-time migration rewrites and exclusively locks an existing table, so
    upgrades with large or busy key–value tables should schedule it
    accordingly.
    [[#930], [#934]]
 -  Fixed the CommonJS PostgreSQL adapter build so it no longer requires
    `@js-temporal/polyfill` at runtime.  The build now bundles
    `temporal-polyfill`, while type declarations rely on the standard
    `esnext.temporal` lib reference.
    [[#823], [#925]]
