import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import { mockDocumentLoader } from "./mockdocloader.ts";

test("mockDocumentLoader()", async () => {
  const response = await mockDocumentLoader("https://example.com/test");
  deepStrictEqual(await response.document, {
    "https://example.com/prop/test": {
      "@value": "foo",
    },
  });
});
