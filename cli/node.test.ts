import { assertEquals } from "@std/assert";
import fetchMock from "fetch-mock";
import { getFaviconUrl } from "./node.ts";

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
  console.log(result);
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
