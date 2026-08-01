import { test } from "@fedify/fixture";
import { strict as assert } from "node:assert";
import { isFederationRequest, isNodeInfoRequest } from "./index.ts";

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
