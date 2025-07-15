import { assertEquals } from "@std/assert";
import fetchMock from "fetch-mock";
import { getFaviconUrl, rgbTo256Color } from "./node.ts";

const HTML_WITH_SMALL_ICON = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Site</title>
  <link rel="icon" href="/favicon.ico" sizes="32x32">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  </head>
<body>Test</body>
</html>
`;

Deno.test("getFaviconUrl - small favicon.ico and apple-touch-icon.png", async () => {
  fetchMock.spyGlobal();

  fetchMock.get("https://example.com/", {
    body: HTML_WITH_SMALL_ICON,
    headers: { "Content-Type": "text/html" },
  });

  const result = await getFaviconUrl("https://example.com/");
  assertEquals(result.href, "https://example.com/apple-touch-icon.png");

  fetchMock.hardReset();
});

const HTML_WITH_ICON = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Site</title>
  <link rel="icon" href="/favicon.ico" sizes="64x64">
  <link rel="apple-touch-icon" href="/apple-touch-icon.png">
  </head>
<body>Test</body>
</html>
`;

Deno.test("getFaviconUrl - favicon.ico and apple-touch-icon.png", async () => {
  fetchMock.spyGlobal();

  fetchMock.get("https://example.com/", {
    body: HTML_WITH_ICON,
    headers: { "Content-Type": "text/html" },
  });

  const result = await getFaviconUrl("https://example.com/");
  console.log(result);
  assertEquals(result.href, "https://example.com/favicon.ico");

  fetchMock.hardReset();
});

const HTML_WITH_SVG_ONLY = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Site</title>
  <link rel="icon" href="/icon.svg" type="image/svg+xml">  
  </head>
<body>Test</body>
</html>
`;

Deno.test("getFaviconUrl - svg icons only falls back to /favicon.ico", async () => {
  fetchMock.spyGlobal();

  fetchMock.get("https://example.com/", {
    body: HTML_WITH_SVG_ONLY,
    headers: { "Content-Type": "text/html" },
  });

  const result = await getFaviconUrl("https://example.com/");
  console.log(result);
  assertEquals(result.href, "https://example.com/favicon.ico");

  fetchMock.hardReset();
});

const HTML_WITHOUT_ICON = `
<!DOCTYPE html>
<html>
<head>
  <title>Test Site</title>
</head>
<body>Test</body>
</html>
`;

Deno.test("getFaviconUrl - falls back to /favicon.ico", async () => {
  fetchMock.spyGlobal();

  fetchMock.get("https://example.com/", {
    body: HTML_WITHOUT_ICON,
    headers: { "Content-Type": "text/html" },
  });

  const result = await getFaviconUrl("https://example.com/");
  assertEquals(result.href, "https://example.com/favicon.ico");

  fetchMock.hardReset();
});

Deno.test("rgbTo256Color - check RGB cube", () => {
  const CUBE_VALUES = [0, 95, 135, 175, 215, 255];
  const COLORS: Array<{ r: number; g: number; b: number }> = [];

  for (let r = 0; r < 6; r++) {
    for (let g = 0; g < 6; g++) {
      for (let b = 0; b < 6; b++) {
        COLORS.push({
          r: CUBE_VALUES[r],
          g: CUBE_VALUES[g],
          b: CUBE_VALUES[b],
        });
      }
    }
  }

  // Expected color indices for the above colors (16-231)
  // RGB cube: 6x6x6 = 216 colors, indices 16-231
  const EXPECTED_CUBE_IDX = Array.from(
    { length: COLORS.length },
    (_, i) => 16 + i,
  );

  const results = COLORS.map((COLOR) =>
    rgbTo256Color(COLOR.r, COLOR.g, COLOR.b)
  );
  assertEquals(results, EXPECTED_CUBE_IDX);
});

Deno.test("rgbTo256Color - check grayscale", () => {
  const GRAYSCALE = Array.from({ length: 24 }).map(
    (_, idx) => ({
      r: 8 + idx * 10,
      g: 8 + idx * 10,
      b: 8 + idx * 10,
    }),
  );

  const EXPECTED_GRAY_IDX = Array.from(
    { length: GRAYSCALE.length },
    (_, i) => 232 + i,
  );

  const results = GRAYSCALE.map((GRAY) =>
    rgbTo256Color(GRAY.r, GRAY.g, GRAY.b)
  );
  assertEquals(results, EXPECTED_GRAY_IDX);
});
