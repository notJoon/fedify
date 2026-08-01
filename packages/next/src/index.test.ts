import {
  createFederation,
  InProcessMessageQueue,
  MemoryKvStore,
} from "@fedify/fedify";
import { test } from "@fedify/fixture";
import { strict as assert } from "node:assert";
import { fedifyWith, isFederationRequest, isNodeInfoRequest } from "./index.ts";

test("Accept header detection", () => {
  const request = new Request("https://example.com/", {
    headers: {
      Accept: "application/activity+json",
    },
  });

  assert.strictEqual(isFederationRequest(request), true);
});

test("Content-Type header detection", () => {
  const request = new Request("https://example.com/", {
    method: "POST",
    headers: {
      "Content-Type": "application/activity+json",
    },
  });

  assert.strictEqual(isFederationRequest(request), true);
});

test("NodeInfo route detection", () => {
  const request1 = new Request("https://example.com/.well-known/nodeinfo", {});

  const request2 = new Request(
    "https://example.com/.well-known/x-nodeinfo2",
    {},
  );

  assert.strictEqual(isNodeInfoRequest(request1), true);
  assert.strictEqual(isNodeInfoRequest(request2), true);
});

test("Non-federation request delegation", async () => {
  const federation = createFederation({
    kv: new MemoryKvStore(),
    queue: new InProcessMessageQueue(),
  });
  const customMiddleware = (request: Request) => {
    if (request.url === "https://example.com/test") {
      return new Response("Custom middleware response");
    }
    return new Response("Default response");
  };
  const middleware = fedifyWith(federation)(customMiddleware);

  const request = new Request("https://example.com/", {
    headers: {
      Accept: "text/html",
    },
  });

  const request2 = new Request("https://example.com/test", {
    headers: {
      Accept: "text/html",
    },
  });

  assert.strictEqual(isFederationRequest(request), false);
  assert.strictEqual(isFederationRequest(request2), false);

  const response1 = await middleware(request);
  const response2 = await middleware(request2);

  assert.strictEqual(await response1.text(), "Default response");
  assert.strictEqual(await response2.text(), "Custom middleware response");
});
