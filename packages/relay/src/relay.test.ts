import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { MemoryKvStore } from "@fedify/fedify";
import { LitePubRelay, MastodonRelay, type RelayOptions } from "./relay.ts";

describe("MastodonRelay", () => {
  test("creates relay with required options", () => {
    const options: RelayOptions = {
      kv: new MemoryKvStore(),
      domain: "relay.example.com",
    };

    const relay = new MastodonRelay(options);
    strictEqual(relay.domain, "relay.example.com");
  });
});

describe("LitePubRelay", () => {
  test("creates relay with required options", () => {
    const options: RelayOptions = {
      kv: new MemoryKvStore(),
      domain: "relay.example.com",
    };

    const relay = new LitePubRelay(options);
    strictEqual(relay.domain, "relay.example.com");
  });
});
