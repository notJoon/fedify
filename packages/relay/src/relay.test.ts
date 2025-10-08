import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import {
  generateCryptoKeyPair,
  InProcessMessageQueue,
  MemoryKvStore,
} from "@fedify/fedify";
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

  test("creates relay with all options", () => {
    const options: RelayOptions = {
      kv: new MemoryKvStore(),
      domain: "relay.example.com",
      queue: new InProcessMessageQueue(),
      actorPath: "actor",
      preferredUsername: "relay",
      requireApproval: true,
      allowlist: ["hackers.pub", "mastodon.social"],
      blocklist: ["blocked.social"],
      maxSubscribers: 100,
      allowedActivityTypes: ["Announce", "Create", "Update", "Delete"],
      privateKeyPair: generateCryptoKeyPair(),
      maxAttempts: 3,
      delayMs: 5,
    };

    const relay = new MastodonRelay(options);
    strictEqual(relay.domain, "relay.example.com");
    // TODO: test only Mastodon specific method
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

  test("creates relay with all options", () => {
    const options: RelayOptions = {
      kv: new MemoryKvStore(),
      domain: "relay.example.com",
      queue: new InProcessMessageQueue(),
      actorPath: "actor",
      preferredUsername: "relay",
      requireApproval: true,
      allowlist: ["hackers.pub", "mastodon.social"],
      blocklist: ["blocked.social"],
      maxSubscribers: 100,
      allowedActivityTypes: ["Announce", "Create", "Update", "Delete"],
      privateKeyPair: generateCryptoKeyPair(),
      maxAttempts: 3,
      delayMs: 5,
    };

    const relay = new LitePubRelay(options);
    strictEqual(relay.domain, "relay.example.com");
    // TODO: test only LitePub specific method
  });
});
