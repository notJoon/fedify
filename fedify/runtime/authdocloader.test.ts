import * as mf from "@hongminhee/deno-mock-fetch";
import { assertEquals, assertRejects } from "@std/assert";
import { verifyRequest } from "../sig/http.ts";
import { mockDocumentLoader } from "../testing/docloader.ts";
import { rsaPrivateKey2 } from "../testing/keys.ts";
import { test } from "../testing/mod.ts";
import { getAuthenticatedDocumentLoader } from "./authdocloader.ts";
import { UrlError } from "./url.ts";

test("getAuthenticatedDocumentLoader()", async (t) => {
  mf.install();

  mf.mock("GET@/object", async (req) => {
    const v = await verifyRequest(
      req,
      {
        documentLoader: mockDocumentLoader,
        contextLoader: mockDocumentLoader,
        currentTime: Temporal.Now.instant(),
      },
    );
    return new Response(JSON.stringify(v != null), {
      headers: { "Content-Type": "application/json" },
    });
  });

  await t.step("test", async () => {
    const loader = await getAuthenticatedDocumentLoader({
      keyId: new URL("https://example.com/key2"),
      privateKey: rsaPrivateKey2,
    });
    assertEquals(await loader("https://example.com/object"), {
      contextUrl: null,
      documentUrl: "https://example.com/object",
      document: true,
    });
  });

  mf.uninstall();

  await t.step("deny non-HTTP/HTTPS", async () => {
    const loader = await getAuthenticatedDocumentLoader({
      keyId: new URL("https://example.com/key2"),
      privateKey: rsaPrivateKey2,
    });
    assertRejects(() => loader("ftp://localhost"), UrlError);
  });

  await t.step("deny private network", async () => {
    const loader = await getAuthenticatedDocumentLoader({
      keyId: new URL("https://example.com/key2"),
      privateKey: rsaPrivateKey2,
    });
    assertRejects(() => loader("http://localhost"), UrlError);
  });
});
