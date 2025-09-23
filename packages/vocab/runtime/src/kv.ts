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
