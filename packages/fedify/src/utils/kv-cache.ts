import type {
  DocumentLoader,
  DocumentLoaderOptions,
  RemoteDocument,
} from "@fedify/vocab-runtime";
import { getLogger } from "@logtape/logtape";
import { preloadedContexts } from "./contexts.ts";

const logger = getLogger(["fedify", "utils", "kv-cache"]);

/**
 * A key for a key–value store.  An array of one or more strings.
 *
 * from {@link https://github.com/fedify-dev/fedify/blob/main/packages/fedify/src/federation/kv.ts}
 */
export type KvKey = readonly [string] | readonly [string, ...string[]];

/**
 * Additional options for setting a value in a key–value store.
 *
 * from {@link https://github.com/fedify-dev/fedify/blob/main/packages/fedify/src/federation/kv.ts}
 */
export interface KvStoreSetOptions {
  /**
   * The time-to-live (TTL) for the value.
   */
  ttl?: Temporal.Duration;
}

/**
 * An abstract interface for a key–value store.
 *
 * from {@link https://github.com/fedify-dev/fedify/blob/main/packages/fedify/src/federation/kv.ts}
 */
export interface KvStore {
  /**
   * Gets the value for the given key.
   * @param key The key to get the value for.
   * @returns The value for the key, or `undefined` if the key does not exist.
   * @template T The type of the value to get.
   */
  get<T = unknown>(key: KvKey): Promise<T | undefined>;

  /**
   * Sets the value for the given key.
   * @param key The key to set the value for.
   * @param value The value to set.
   * @param options Additional options for setting the value.
   */
  set(key: KvKey, value: unknown, options?: KvStoreSetOptions): Promise<void>;

  /**
   * Deletes the value for the given key.
   * @param key The key to delete.
   */
  delete(key: KvKey): Promise<void>;

  /**
   * Compare-and-swap (CAS) operation for the key–value store.
   * @param key The key to perform the CAS operation on.
   * @param expectedValue The expected value for the key.
   * @param newValue The new value to set if the expected value matches.
   * @param options Additional options for setting the value.
   * @return `true` if the CAS operation was successful, `false` otherwise.
   * from {@link https://github.com/fedify-dev/fedify/blob/main/packages/fedify/src/federation/kv.ts}
   */
  cas?: (
    key: KvKey,
    expectedValue: unknown,
    newValue: unknown,
    options?: KvStoreSetOptions,
  ) => Promise<boolean>;
}

/**
 * A mock implementation of a key–value store for testing purposes.
 */
export class MockKvStore implements KvStore {
  #values: Record<string, unknown> = {};
  get<T = unknown>(key: KvKey): Promise<T | undefined> {
    return Promise.resolve(this.#values[JSON.stringify(key)] as T | undefined);
  }
  set(
    key: KvKey,
    value: unknown,
    _options?: KvStoreSetOptions,
  ): Promise<void> {
    this.#values[JSON.stringify(key)] = value;
    return Promise.resolve();
  }
  async delete(_: KvKey): Promise<void> {}
  cas(
    ..._: [KvKey, unknown, unknown]
  ): Promise<boolean> {
    return Promise.resolve(false);
  }
}

/**
 * The parameters for {@link kvCache} function.
 */
export interface KvCacheParameters {
  /**
   * The document loader to decorate with a cache.
   */
  loader: DocumentLoader;

  /**
   * The key–value store to use for backing the cache.
   */
  kv: KvStore;

  /**
   * The key prefix to use for namespacing the cache.
   * `["_fedify", "remoteDocument"]` by default.
   */
  prefix?: KvKey;

  /**
   * The per-URL cache rules in the array of `[urlPattern, duration]` pairs
   * where `urlPattern` is either a string, a {@link URL}, or
   * a {@link URLPattern} and `duration` is a {@link Temporal.Duration}.
   * The `duration` is allowed to be at most 30 days.
   *
   * By default, 5 minutes for all URLs.
   */
  rules?: [string | URL | URLPattern, Temporal.Duration][];
}

/**
 * Decorates a {@link DocumentLoader} with a cache backed by a {@link Deno.Kv}.
 * @param parameters The parameters for the cache.
 * @returns The decorated document loader which is cache-enabled.
 */
export function kvCache(
  { loader, kv, prefix, rules }: KvCacheParameters,
): DocumentLoader {
  const keyPrefix = prefix ?? ["_fedify", "remoteDocument"];
  rules ??= [
    [new URLPattern({}), Temporal.Duration.from({ minutes: 5 })],
  ];
  for (const [p, duration] of rules) {
    if (Temporal.Duration.compare(duration, { days: 30 }) > 0) {
      throw new TypeError(
        "The maximum cache duration is 30 days: " +
          (p instanceof URLPattern
            ? `${p.protocol}://${p.username}:${p.password}@${p.hostname}:${p.port}/${p.pathname}?${p.search}#${p.hash}`
            : p.toString()),
      );
    }
  }

  return async (
    url: string,
    options?: DocumentLoaderOptions,
  ): Promise<RemoteDocument> => {
    if (url in preloadedContexts) {
      logger.debug("Using preloaded context: {url}.", { url });
      return {
        contextUrl: null,
        document: preloadedContexts[url],
        documentUrl: url,
      };
    }
    const match = matchRule(url, rules);
    if (match == null) return await loader(url, options);
    const key: KvKey = [...keyPrefix, url];
    let cache: RemoteDocument | undefined = undefined;
    try {
      cache = await kv.get<RemoteDocument>(key);
    } catch (error) {
      if (error instanceof Error) {
        logger.warn(
          "Failed to get the document of {url} from the KV cache: {error}",
          { url, error },
        );
      }
    }
    if (cache == null) {
      const remoteDoc = await loader(url, options);
      try {
        await kv.set(key, remoteDoc, { ttl: match });
      } catch (error) {
        logger.warn(
          "Failed to save the document of {url} to the KV cache: {error}",
          { url, error },
        );
      }
      return remoteDoc;
    }
    return cache;
  };
}

function matchRule(
  url: string,
  rules: [string | URL | URLPattern, Temporal.Duration][],
): Temporal.Duration | null {
  for (const [pattern, duration] of rules!) {
    if (typeof pattern === "string") {
      if (url === pattern) return duration;
      continue;
    }
    if (pattern instanceof URL) {
      if (pattern.href == url) return duration;
      continue;
    }
    if (pattern.test(url)) return duration;
  }
  return null;
}
