import { Elysia } from "elysia";
import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { fedify } from "./index.ts";

interface MockFederation {
  fetch(request: Request, options: unknown): Promise<Response>;
}

describe("[elysia] fedify() plugin", () => {
  test("fedify() calls the context data factory when handling a request", async () => {
    const elysia = new Elysia();
    const mockFederation: MockFederation = {
      fetch: () => Promise.resolve(new Response("OK")),
    };
    let count = 0;
    const mockContextDataFactory = () => {
      // increases count if this method called
      count++;
    };

    elysia.use(fedify(mockFederation as never, mockContextDataFactory));
    await elysia.handle(new Request("http://localhost/"));

    assert.strictEqual(count, 1, "the context data factory must be called");
  });

  test("fedify() calls federation.fetch() with the context data", async () => {
    const elysia = new Elysia();
    const mockFederation: MockFederation = {
      fetch: (_req, opts) => {
        // return context data
        const contextData = (opts as { contextData: string }).contextData;
        return Promise.resolve(new Response(contextData));
      },
    };
    const mockContextDataFactory = () => "Hello World";

    elysia.use(fedify(mockFederation as never, mockContextDataFactory));
    const actual = await elysia.handle(new Request("http://localhost/"))
      .then((res) => res.text());

    assert.strictEqual(
      actual,
      "Hello World",
      "federation.fetch() must receive the context data returned by the factory",
    );
  });
});
