import type { KVNamespace } from "@cloudflare/workers-types/experimental";
import type { KvKey, KvStore, KvStoreSetOptions } from "../federation/kv.ts";

interface KvMetadata {
  expires?: number;
}

/**
 * Implementation of the KvStore interface for Cloudflare Workers KV binding.
 * This class provides a wrapper around Cloudflare's KV namespace to store and
 * retrieve JSON-serializable values using structured keys.
 * @since 1.6.0
 */
export class WorkersKvStore implements KvStore {
  #namespace: KVNamespace<string>;

  constructor(namespace: KVNamespace<string>) {
    this.#namespace = namespace;
  }

  #encodeKey(key: KvKey): string {
    return JSON.stringify(key);
  }

  async get<T = unknown>(key: KvKey): Promise<T | undefined> {
    const encodedKey = this.#encodeKey(key);
    const { value, metadata } = await this.#namespace.getWithMetadata(
      encodedKey,
      "json",
    );
    return metadata == null || metadata.expires < Date.now()
      ? undefined
      : value as T;
  }

  async set(
    key: KvKey,
    value: unknown,
    options?: KvStoreSetOptions,
  ): Promise<void> {
    const encodedKey = this.#encodeKey(key);
    const metadata: KvMetadata = options?.ttl == null ? {} : {
      expires: Date.now() + options.ttl.total("milliseconds"),
    };
    await this.#namespace.put(
      encodedKey,
      JSON.stringify(value),
      options?.ttl == null ? { metadata } : {
        // According to Cloudflare Workers KV documentation,
        // the minimum TTL is 60 seconds:
        expirationTtl: Math.max(options.ttl.total("seconds"), 60),
        metadata,
      },
    );
  }

  delete(key: KvKey): Promise<void> {
    return this.#namespace.delete(this.#encodeKey(key));
  }
}
