import type { Context, KvStore, MessageQueue } from "@fedify/fedify";

/**
 * Handler for subscription requests (Follow/Undo activities).
 */
export type SubscriptionRequestHandler = (
  ctx: Context<void>,
  actor: string,
  activity: unknown,
) => Promise<void>;

/**
 * Handler for incoming activities to be relayed.
 */
export type ActivityHandler = (
  ctx: Context<void>,
  activity: unknown,
) => Promise<void>;

/**
 * Configuration options for the ActivityPub relay.
 */
export interface RelayOptions {
  kv: KvStore;
  queue?: MessageQueue;
  domain?: string;
  actorPath?: string;
  preferredUsername?: string;
  requireApproval?: boolean;
  allowlist?: string[];
  blocklist?: string[];
  maxSubscribers?: number;
  allowedActivityTypes?: string[];
  privateKeyPair?: Promise<CryptoKeyPair>;
  maxAttempts?: number;
  delayMs?: number;
}

/**
 * Base interface for ActivityPub relay implementations.
 */
export interface Relay {
  readonly domain: string;
  readonly actorPath: string;
  readonly actorId: string;
  readonly preferredUsername: string;
  readonly handle: string;
  readonly requiresApproval: boolean;
  readonly maxSubscribers?: number;

  fetch(request: Request, options?: RelayOptions): Promise<Response>;
  setSubscriptionHandler(handler: SubscriptionRequestHandler): this;
  setActivityHandler(handler: ActivityHandler): this;
  getSubscribers(ctx: Context<void>): Promise<string[]>;
  approveSubscriber(ctx: Context<void>, clientActor: string): Promise<void>;
  blockSubscriber(ctx: Context<void>, clientActor: string): Promise<void>;
}

/**
 * A Mastodon-compatible ActivityPub relay implementation.
 * This relay follows Mastodon's relay protocol for maximum compatibility
 * with Mastodon instances.
 *
 * @since 2.0.0
 */
export class MastodonRelay implements Relay {
  #options: RelayOptions;
  #subscriptionHandler?: SubscriptionRequestHandler;
  #activityHandler?: ActivityHandler;

  constructor(options: RelayOptions) {
    this.#options = options;
  }

  get domain(): string {
    return this.#options.domain || "localhost";
  }

  get actorPath(): string {
    return this.#options.actorPath || "actor";
  }

  get actorId(): string {
    return `https://${this.domain}/${this.actorPath}`;
  }

  get preferredUsername(): string {
    return this.#options.preferredUsername || "relay";
  }

  get handle(): string {
    return `@${this.preferredUsername}@${this.domain}`;
  }

  get requiresApproval(): boolean {
    return this.#options.requireApproval ?? false;
  }

  get maxSubscribers(): number | undefined {
    return this.#options.maxSubscribers;
  }

  fetch(request: Request, options?: RelayOptions): Promise<Response> {
    // TODO: Implement Mastodon-specific fetch logic
    console.log("MastodonRelay: Fetching request:", request, options);
    return Promise.resolve(new Response());
  }

  setSubscriptionHandler(handler: SubscriptionRequestHandler): this {
    this.#subscriptionHandler = handler;
    return this;
  }

  setActivityHandler(handler: ActivityHandler): this {
    this.#activityHandler = handler;
    return this;
  }

  async getSubscribers(ctx: Context<void>): Promise<string[]> {
    // TODO: Implement getting subscribers from KV store
    console.log("MastodonRelay: Getting subscribers", ctx);
    const subscribers = await this.#options.kv.get<string[]>([
      "relay",
      "subscribers",
    ]);
    return subscribers || [];
  }

  async approveSubscriber(
    ctx: Context<void>,
    clientActor: string,
  ): Promise<void> {
    // TODO: Implement subscriber approval in KV store
    console.log("MastodonRelay: Approving subscriber:", ctx, clientActor);
    await Promise.resolve();
  }

  async blockSubscriber(
    ctx: Context<void>,
    clientActor: string,
  ): Promise<void> {
    // TODO: Implement subscriber blocking in KV store
    console.log("MastodonRelay: Blocking subscriber:", ctx, clientActor);
    await Promise.resolve();
  }

  async handleActivity(activity: unknown): Promise<void> {
    // TODO: Implement Mastodon-specific activity handling logic
    console.log("MastodonRelay: Handling activity:", activity);
    await Promise.resolve();
  }

  async forwardActivity(activity: unknown): Promise<void> {
    // TODO: Implement Mastodon-specific activity forwarding logic
    console.log("MastodonRelay: Forwarding activity:", activity);
    await Promise.resolve();
  }

  async handleSubscription(actor: string): Promise<void> {
    // TODO: Implement Mastodon-specific subscription handling logic
    console.log("MastodonRelay: Handling subscription from:", actor);
    await Promise.resolve();
  }

  async handleUnsubscription(actor: string): Promise<void> {
    // TODO: Implement Mastodon-specific unsubscription handling logic
    console.log("MastodonRelay: Handling unsubscription from:", actor);
    await Promise.resolve();
  }

  async isActorAllowed(actor: string): Promise<boolean> {
    if (this.#options.blocklist) {
      for (const domain of this.#options.blocklist) {
        if (await actor.includes(domain)) {
          return false;
        }
      }
    }
    if (this.#options.allowlist && this.#options.allowlist.length > 0) {
      for (const domain of this.#options.allowlist) {
        if (await actor.includes(domain)) {
          return true;
        }
      }
      return false; // Has allowlist but actor not in it
    }

    return true; // No allowlist, allow by default
  }
}

/**
 * A LitePub-compatible ActivityPub relay implementation.
 * This relay follows LitePub's relay protocol and extensions for
 * enhanced federation capabilities.
 *
 * @since 2.0.0
 */
export class LitePubRelay implements Relay {
  #options: RelayOptions;
  #subscriptionHandler?: SubscriptionRequestHandler;
  #activityHandler?: ActivityHandler;

  constructor(options: RelayOptions) {
    this.#options = options;
  }

  get domain(): string {
    return this.#options.domain || "localhost";
  }

  get actorPath(): string {
    return this.#options.actorPath || "actor";
  }

  get actorId(): string {
    return `https://${this.domain}/${this.actorPath}`;
  }

  get preferredUsername(): string {
    return this.#options.preferredUsername || "relay";
  }

  get handle(): string {
    return `@${this.preferredUsername}@${this.domain}`;
  }

  get requiresApproval(): boolean {
    return this.#options.requireApproval ?? false;
  }

  get maxSubscribers(): number | undefined {
    return this.#options.maxSubscribers;
  }

  fetch(request: Request, options?: RelayOptions): Promise<Response> {
    // TODO: Implement LitePub-specific fetch logic
    console.log("LitePubRelay: Fetching request:", request, options);
    return Promise.resolve(new Response());
  }

  setSubscriptionHandler(handler: SubscriptionRequestHandler): this {
    this.#subscriptionHandler = handler;
    return this;
  }

  setActivityHandler(handler: ActivityHandler): this {
    this.#activityHandler = handler;
    return this;
  }

  async getSubscribers(ctx: Context<void>): Promise<string[]> {
    // TODO: Implement getting subscribers from KV store
    console.log("LitePubRelay: Getting subscribers", ctx);
    const subscribers = await this.#options.kv.get<string[]>([
      "relay",
      "subscribers",
    ]);
    return subscribers || [];
  }

  async approveSubscriber(
    ctx: Context<void>,
    clientActor: string,
  ): Promise<void> {
    // TODO: Implement subscriber approval in KV store
    console.log("LitePubRelay: Approving subscriber:", ctx, clientActor);
    await Promise.resolve();
  }

  async blockSubscriber(
    ctx: Context<void>,
    clientActor: string,
  ): Promise<void> {
    // TODO: Implement subscriber blocking in KV store
    console.log("LitePubRelay: Blocking subscriber:", ctx, clientActor);
    await Promise.resolve();
  }

  async handleActivity(activity: unknown): Promise<void> {
    // TODO: Implement LitePub-specific activity handling logic
    console.log("LitePubRelay: Handling activity:", activity);
    await Promise.resolve();
  }

  async forwardActivity(activity: unknown): Promise<void> {
    // TODO: Implement LitePub-specific activity forwarding logic
    console.log("LitePubRelay: Forwarding activity:", activity);
    await Promise.resolve();
  }

  async handleSubscription(actor: string): Promise<void> {
    // TODO: Implement LitePub-specific subscription handling logic
    console.log("LitePubRelay: Handling subscription from:", actor);
    await Promise.resolve();
  }

  async handleUnsubscription(actor: string): Promise<void> {
    // TODO: Implement LitePub-specific unsubscription handling logic
    console.log("LitePubRelay: Handling unsubscription from:", actor);
    await Promise.resolve();
  }

  async isActorAllowed(actor: string): Promise<boolean> {
    if (this.#options.blocklist) {
      for (const domain of this.#options.blocklist) {
        if (await actor.includes(domain)) {
          return false;
        }
      }
    }
    if (this.#options.allowlist && this.#options.allowlist.length > 0) {
      for (const domain of this.#options.allowlist) {
        if (await actor.includes(domain)) {
          return true;
        }
      }
      return false; // Has allowlist but actor not in it
    }

    return true; // No allowlist, allow by default
  }
}
