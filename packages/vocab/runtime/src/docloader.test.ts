import fetchMock from "fetch-mock";
import { deepStrictEqual, rejects, throws } from "node:assert";
import process from "node:process";
import { test } from "node:test";
import metadata from "../deno.json" with { type: "json" };
import preloadedContexts from "./contexts.ts";
import {
  type DocumentLoader,
  FetchError,
  getDocumentLoader,
  getUserAgent,
  kvCache,
} from "./docloader.ts";
import type { KvKey, KvStore, KvStoreSetOptions } from "./kv.ts";
import { MockKvStore } from "./kv.ts";
import { mockDocumentLoader } from "./mockdocloader.ts";
import { UrlError } from "./url.ts";

test("new FetchError()", () => {
  const e = new FetchError("https://example.com/", "An error message.");
  deepStrictEqual(e.name, "FetchError");
  deepStrictEqual(e.url, new URL("https://example.com/"));
  deepStrictEqual(e.message, "https://example.com/: An error message.");

  const e2 = new FetchError(new URL("https://example.org/"));
  deepStrictEqual(e2.url, new URL("https://example.org/"));
  deepStrictEqual(e2.message, "https://example.org/");
});

test("getDocumentLoader()", async (t) => {
  const fetchDocumentLoader = getDocumentLoader();

  fetchMock.spyGlobal();

  fetchMock.get("https://example.com/object", {
    body: {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: "https://example.com/object",
      name: "Fetched object",
      type: "Object",
    },
  });

  await t.test("ok", async () => {
    deepStrictEqual(await fetchDocumentLoader("https://example.com/object"), {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://example.com/object",
        name: "Fetched object",
        type: "Object",
      },
    });
  });

  fetchMock.get("https://example.com/link-ctx", {
    body: {
      id: "https://example.com/link-ctx",
      name: "Fetched object",
      type: "Object",
    },
    headers: {
      "Content-Type": "application/activity+json",
      Link: "<https://www.w3.org/ns/activitystreams>; " +
        'rel="http://www.w3.org/ns/json-ld#context"; ' +
        'type="application/ld+json"',
    },
  });

  fetchMock.get("https://example.com/link-obj", {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      Link: '<https://example.com/object>; rel="alternate"; ' +
        'type="application/activity+json"',
    },
  });

  fetchMock.get("https://example.com/link-obj-relative", {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      Link: '</object>; rel="alternate"; ' +
        'type="application/activity+json"',
    },
  });

  fetchMock.get("https://example.com/obj-w-wrong-link", {
    body: {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: "https://example.com/obj-w-wrong-link",
      name: "Fetched object",
      type: "Object",
    },
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      Link: '<https://example.com/object>; rel="alternate"; ' +
        'type="application/ld+json; profile="https://www.w3.org/ns/activitystreams""',
    },
  });

  await t.test("Link header", async () => {
    deepStrictEqual(await fetchDocumentLoader("https://example.com/link-ctx"), {
      contextUrl: "https://www.w3.org/ns/activitystreams",
      documentUrl: "https://example.com/link-ctx",
      document: {
        id: "https://example.com/link-ctx",
        name: "Fetched object",
        type: "Object",
      },
    });

    deepStrictEqual(await fetchDocumentLoader("https://example.com/link-obj"), {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://example.com/object",
        name: "Fetched object",
        type: "Object",
      },
    });
  });

  await t.test("Link header relative url", async () => {
    deepStrictEqual(await fetchDocumentLoader("https://example.com/link-ctx"), {
      contextUrl: "https://www.w3.org/ns/activitystreams",
      documentUrl: "https://example.com/link-ctx",
      document: {
        id: "https://example.com/link-ctx",
        name: "Fetched object",
        type: "Object",
      },
    });

    deepStrictEqual(
      await fetchDocumentLoader("https://example.com/link-obj-relative"),
      {
        contextUrl: null,
        documentUrl: "https://example.com/object",
        document: {
          "@context": "https://www.w3.org/ns/activitystreams",
          id: "https://example.com/object",
          name: "Fetched object",
          type: "Object",
        },
      },
    );
  });

  await t.test("wrong Link header syntax", async () => {
    deepStrictEqual(
      await fetchDocumentLoader("https://example.com/obj-w-wrong-link"),
      {
        contextUrl: null,
        documentUrl: "https://example.com/obj-w-wrong-link",
        document: {
          "@context": "https://www.w3.org/ns/activitystreams",
          id: "https://example.com/obj-w-wrong-link",
          name: "Fetched object",
          type: "Object",
        },
      },
    );
  });

  fetchMock.get("https://example.com/html-link", {
    body: `<html>
        <head>
          <meta charset=utf-8>
          <link
            rel=alternate
            type='application/activity+json'
            href="https://example.com/object">
        </head>
      </html>`,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  await t.test("HTML <link>", async () => {
    deepStrictEqual(
      await fetchDocumentLoader("https://example.com/html-link"),
      {
        contextUrl: null,
        documentUrl: "https://example.com/object",
        document: {
          "@context": "https://www.w3.org/ns/activitystreams",
          id: "https://example.com/object",
          name: "Fetched object",
          type: "Object",
        },
      },
    );
  });

  fetchMock.get("https://example.com/xhtml-link", {
    body: `<html>
        <head>
          <meta charset="utf-8" />
          <link
            rel=alternate
            type="application/activity+json"
            href="https://example.com/object" />
        </head>
      </html>`,
    headers: { "Content-Type": "application/xhtml+xml; charset=utf-8" },
  });

  await t.test("XHTML <link>", async () => {
    deepStrictEqual(
      await fetchDocumentLoader("https://example.com/xhtml-link"),
      {
        contextUrl: null,
        documentUrl: "https://example.com/object",
        document: {
          "@context": "https://www.w3.org/ns/activitystreams",
          id: "https://example.com/object",
          name: "Fetched object",
          type: "Object",
        },
      },
    );
  });

  fetchMock.get("https://example.com/html-a", {
    body: `<html>
        <head>
          <meta charset=utf-8>
        </head>
        <body>
          <a
            rel=alternate
            type=application/activity+json
            href=https://example.com/object>test</a>
        </body>
      </html>`,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  await t.test("HTML <a>", async () => {
    deepStrictEqual(await fetchDocumentLoader("https://example.com/html-a"), {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://example.com/object",
        name: "Fetched object",
        type: "Object",
      },
    });
  });

  fetchMock.get("https://example.com/wrong-content-type", {
    body: {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: "https://example.com/wrong-content-type",
      name: "Fetched object",
      type: "Object",
    },
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  await t.test("Wrong Content-Type", async () => {
    deepStrictEqual(
      await fetchDocumentLoader("https://example.com/wrong-content-type"),
      {
        contextUrl: null,
        documentUrl: "https://example.com/wrong-content-type",
        document: {
          "@context": "https://www.w3.org/ns/activitystreams",
          id: "https://example.com/wrong-content-type",
          name: "Fetched object",
          type: "Object",
        },
      },
    );
  });

  fetchMock.get("https://example.com/404", { status: 404 });

  await t.test("not ok", async () => {
    await rejects(
      () => fetchDocumentLoader("https://example.com/404"),
      FetchError,
      "HTTP 404: https://example.com/404",
    );
  });

  await t.test("preloaded contexts", async () => {
    for (const [url, document] of Object.entries(preloadedContexts)) {
      deepStrictEqual(await fetchDocumentLoader(url), {
        contextUrl: null,
        documentUrl: url,
        document,
      });
    }
  });

  await t.test("deny non-HTTP/HTTPS", async () => {
    await rejects(
      () => fetchDocumentLoader("ftp://localhost"),
      UrlError,
    );
  });

  fetchMock.get("https://example.com/localhost-redirect", {
    status: 302,
    headers: { Location: "https://localhost/object" },
  });

  fetchMock.get("https://example.com/localhost-link", {
    body: `<html>
        <head>
          <meta charset=utf-8>
          <link
            rel=alternate
            type='application/activity+json'
            href="https://localhost/object">
        </head>
      </html>`,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });

  fetchMock.get("https://localhost/object", {
    body: {
      "@context": "https://www.w3.org/ns/activitystreams",
      id: "https://localhost/object",
      name: "Fetched object",
      type: "Object",
    },
  });

  await t.test("allowPrivateAddress: false", async () => {
    await rejects(
      () => fetchDocumentLoader("https://localhost/object"),
      UrlError,
    );
    await rejects(
      () => fetchDocumentLoader("https://example.com/localhost-redirect"),
      UrlError,
    );
    await rejects(
      () => fetchDocumentLoader("https://example.com/localhost-link"),
      UrlError,
    );
  });

  const fetchDocumentLoader2 = getDocumentLoader({ allowPrivateAddress: true });

  await t.test("allowPrivateAddress: true", async () => {
    const expected = {
      contextUrl: null,
      documentUrl: "https://localhost/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://localhost/object",
        name: "Fetched object",
        type: "Object",
      },
    };
    deepStrictEqual(
      await fetchDocumentLoader2("https://localhost/object"),
      expected,
    );
    deepStrictEqual(
      await fetchDocumentLoader2("https://example.com/localhost-redirect"),
      expected,
    );
    deepStrictEqual(
      await fetchDocumentLoader2("https://example.com/localhost-link"),
      expected,
    );
  });

  fetchMock.hardReset();
});

test("kvCache()", async (t) => {
  const kv = new MockKvStore();

  await t.test("cached", async () => {
    const loader = kvCache({
      kv,
      loader: mockDocumentLoader,
      rules: [
        ["https://example.org/", Temporal.Duration.from({ days: 1 })],
        [new URL("https://example.net/"), Temporal.Duration.from({ days: 1 })],
        [
          new URLPattern("https://example.com/*"),
          Temporal.Duration.from({ days: 30 }),
        ],
      ],
      prefix: ["_test", "cached"],
    });
    const result = await loader("https://example.com/object");
    deepStrictEqual(result, {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://example.com/object",
        name: "Fetched object",
        type: "Object",
      },
    });
    const cache = await kv.get([
      "_test",
      "cached",
      "https://example.com/object",
    ]);
    deepStrictEqual(cache, result);

    await kv.set(
      ["_test", "cached", "https://example.org/"],
      {
        contextUrl: null,
        documentUrl: "https://example.org/",
        document: {
          "id": "https://example.org/",
        },
      },
    );
    const result2 = await loader("https://example.org/");
    deepStrictEqual(result2, {
      contextUrl: null,
      documentUrl: "https://example.org/",
      document: {
        "id": "https://example.org/",
      },
    });

    await kv.set(
      ["_test", "cached", "https://example.net/"],
      {
        contextUrl: null,
        documentUrl: "https://example.net/",
        document: {
          "id": "https://example.net/",
        },
      },
    );
    const result3 = await loader("https://example.net/");
    deepStrictEqual(result3, {
      contextUrl: null,
      documentUrl: "https://example.net/",
      document: {
        "id": "https://example.net/",
      },
    });
  });

  await t.test("not cached", async () => {
    const loader = kvCache({
      kv,
      loader: mockDocumentLoader,
      rules: [],
      prefix: ["_test", "not cached"],
    });
    const result = await loader("https://example.com/object");
    deepStrictEqual(result, {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://example.com/object",
        name: "Fetched object",
        type: "Object",
      },
    });
    const cache = await kv.get([
      "test2",
      "not cached",
      "https://example.com/object",
    ]);
    deepStrictEqual(cache, undefined);
  });

  await t.test("maximum cache duration", () => {
    throws(
      () =>
        kvCache({
          kv,
          loader: mockDocumentLoader,
          rules: [
            [
              "https://example.com/",
              Temporal.Duration.from({ days: 30, seconds: 1 }),
            ],
          ],
        }),
      TypeError,
      "The maximum cache duration is 30 days",
    );
    throws(
      () =>
        kvCache({
          kv,
          loader: mockDocumentLoader,
          rules: [
            [
              new URLPattern("https://example.com/*"),
              Temporal.Duration.from({ days: 30, seconds: 1 }),
            ],
          ],
        }),
      TypeError,
      "The maximum cache duration is 30 days",
    );
  });

  await t.test("on kv store exception", async () => {
    class KvStoreThrowsException implements KvStore {
      get<T = unknown>(_key: KvKey): Promise<T | undefined> {
        throw new Error("Failed to get key");
      }
      set(
        _key: KvKey,
        _value: unknown,
        _options?: KvStoreSetOptions,
      ): Promise<void> {
        throw new Error("Failed to set key");
      }
      delete(_key: KvKey): Promise<void> {
        throw new Error("Failed to delete key");
      }
    }

    const loader = kvCache({
      kv: new KvStoreThrowsException(),
      loader: mockDocumentLoader,
      rules: [
        ["https://example.org/", Temporal.Duration.from({ days: 1 })],
        [new URL("https://example.net/"), Temporal.Duration.from({ days: 1 })],
        [
          new URLPattern("https://example.com/*"),
          Temporal.Duration.from({ days: 30 }),
        ],
      ],
      prefix: ["_test", "not cached"],
    });
    const result = await loader("https://example.com/object");
    deepStrictEqual(result, {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: {
        "@context": "https://www.w3.org/ns/activitystreams",
        id: "https://example.com/object",
        name: "Fetched object",
        type: "Object",
      },
    });
  });

  await t.test("preloaded contexts bypass cache", async () => {
    const kv = new MockKvStore();
    let loaderCalled = false;
    const mockLoader: DocumentLoader = (url: string) => {
      loaderCalled = true;
      return Promise.resolve({
        contextUrl: null,
        documentUrl: url,
        document: { "mock": "document" },
      });
    };

    const loader = kvCache({
      kv,
      loader: mockLoader,
      prefix: ["_test", "preloaded"],
    });

    // Test that preloaded context URLs return preloaded data without calling the wrapped loader
    const activityStreamsUrl = "https://www.w3.org/ns/activitystreams";
    loaderCalled = false;
    const result = await loader(activityStreamsUrl);

    deepStrictEqual(result, {
      contextUrl: null,
      documentUrl: activityStreamsUrl,
      document: preloadedContexts[activityStreamsUrl],
    });
    deepStrictEqual(
      loaderCalled,
      false,
      "Loader should not be called for preloaded contexts",
    );

    // Verify that the preloaded context was not cached in KV store
    const cachedValue = await kv.get([
      "_test",
      "preloaded",
      activityStreamsUrl,
    ]);
    deepStrictEqual(
      cachedValue,
      undefined,
      "Preloaded contexts should not be cached in KV store",
    );

    // Test another preloaded context
    const securityUrl = "https://w3id.org/security/v1";
    loaderCalled = false;
    const result2 = await loader(securityUrl);

    deepStrictEqual(result2, {
      contextUrl: null,
      documentUrl: securityUrl,
      document: preloadedContexts[securityUrl],
    });
    deepStrictEqual(
      loaderCalled,
      false,
      "Loader should not be called for preloaded contexts",
    );

    // Test that non-preloaded URLs still use the cache normally
    const nonPreloadedUrl = "https://example.com/not-preloaded";
    loaderCalled = false;
    const result3 = await loader(nonPreloadedUrl);

    deepStrictEqual(result3, {
      contextUrl: null,
      documentUrl: nonPreloadedUrl,
      document: { "mock": "document" },
    });
    deepStrictEqual(
      loaderCalled,
      true,
      "Loader should be called for non-preloaded URLs",
    );

    // Verify that non-preloaded URL was cached
    const cachedValue2 = await kv.get(["_test", "preloaded", nonPreloadedUrl]);
    deepStrictEqual(
      cachedValue2,
      result3,
      "Non-preloaded URLs should be cached",
    );
  });
});

test("getUserAgent()", () => {
  if ("Deno" in globalThis) {
    deepStrictEqual(
      getUserAgent(),
      `Fedify/${metadata.version} (Deno/${Deno.version.deno})`,
    );
    deepStrictEqual(
      getUserAgent({ software: "MyApp/1.0.0" }),
      `MyApp/1.0.0 (Fedify/${metadata.version}; Deno/${Deno.version.deno})`,
    );
    deepStrictEqual(
      getUserAgent({ url: "https://example.com/" }),
      `Fedify/${metadata.version} (Deno/${Deno.version.deno}; +https://example.com/)`,
    );
    deepStrictEqual(
      getUserAgent({
        software: "MyApp/1.0.0",
        url: new URL("https://example.com/"),
      }),
      `MyApp/1.0.0 (Fedify/${metadata.version}; Deno/${Deno.version.deno}; +https://example.com/)`,
    );
  } else if ("Bun" in globalThis) {
    deepStrictEqual(
      getUserAgent(),
      // @ts-ignore: `Bun` is a global variable in Bun
      `Fedify/${metadata.version} (Bun/${Bun.version})`,
    );
    deepStrictEqual(
      getUserAgent({ software: "MyApp/1.0.0" }),
      // @ts-ignore: `Bun` is a global variable in Bun
      `MyApp/1.0.0 (Fedify/${metadata.version}; Bun/${Bun.version})`,
    );
    deepStrictEqual(
      getUserAgent({ url: "https://example.com/" }),
      // @ts-ignore: `Bun` is a global variable in Bun
      `Fedify/${metadata.version} (Bun/${Bun.version}; +https://example.com/)`,
    );
    deepStrictEqual(
      getUserAgent({
        software: "MyApp/1.0.0",
        url: new URL("https://example.com/"),
      }),
      // @ts-ignore: `Bun` is a global variable in Bun
      `MyApp/1.0.0 (Fedify/${metadata.version}; Bun/${Bun.version}; +https://example.com/)`,
    );
  } else if (navigator.userAgent === "Cloudflare-Workers") {
    deepStrictEqual(
      getUserAgent(),
      `Fedify/${metadata.version} (Cloudflare-Workers)`,
    );
    deepStrictEqual(
      getUserAgent({ software: "MyApp/1.0.0" }),
      `MyApp/1.0.0 (Fedify/${metadata.version}; Cloudflare-Workers)`,
    );
    deepStrictEqual(
      getUserAgent({ url: "https://example.com/" }),
      `Fedify/${metadata.version} (Cloudflare-Workers; +https://example.com/)`,
    );
    deepStrictEqual(
      getUserAgent({
        software: "MyApp/1.0.0",
        url: new URL("https://example.com/"),
      }),
      `MyApp/1.0.0 (Fedify/${metadata.version}; Cloudflare-Workers; +https://example.com/)`,
    );
  } else {
    deepStrictEqual(
      getUserAgent(),
      `Fedify/${metadata.version} (Node.js/${process.versions.node})`,
    );
    deepStrictEqual(
      getUserAgent({ software: "MyApp/1.0.0" }),
      `MyApp/1.0.0 (Fedify/${metadata.version}; Node.js/${process.versions.node})`,
    );
    deepStrictEqual(
      getUserAgent({ url: "https://example.com/" }),
      `Fedify/${metadata.version} (Node.js/${process.versions.node}; +https://example.com/)`,
    );
    deepStrictEqual(
      getUserAgent({
        software: "MyApp/1.0.0",
        url: new URL("https://example.com/"),
      }),
      `MyApp/1.0.0 (Fedify/${metadata.version}; Node.js/${process.versions.node}; +https://example.com/)`,
    );
  }
});
