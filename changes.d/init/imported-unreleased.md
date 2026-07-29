---
links:
  '#950': https://github.com/fedify-dev/fedify/issues/950
  '#952': https://github.com/fedify-dev/fedify/pull/952
---
 -  Fixed `fedify init`'s hydration test validation to run `format` before
    `format:check`, which previously caused the entire test suite to fail when
    the package manager is `npm` or `pnpm`:
    [[#950]]
    [[#952] by Jang Hanarae\]
