---
links:
  '#931': https://github.com/fedify-dev/fedify/issues/931
  '#936': https://github.com/fedify-dev/fedify/pull/936
---
 -  Added and continuously tested support for Astro 6 and 7 while retaining
    Astro 5 compatibility.  The Astro example and `fedify init` templates now
    use Astro 7 with current Node.js and Deno adapters; Bun uses the tested
    `@astrojs/node` standalone output instead of the Astro-5-only
    `@nurodev/astro-bun` adapter.
    [[#931], [#936]]
