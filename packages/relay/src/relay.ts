import {
  type Context,
  createFederation,
  type Federation,
  type KvStore,
} from "@fedify/fedify";
import {
  Accept,
  type Actor,
  Create,
  Delete,
  Follow,
  Move,
  Reject,
  Undo,
  Update,
} from "@fedify/fedify/vocab";

const RELAY_SERVER_ACTOR = "relay";

/**
 * Handler for subscription requests (Follow/Undo activities).
 */
export type SubscriptionRequestHandler = (
  ctx: Context<void>,
  clientActor: Actor,
) => Promise<boolean>;

/**
 * Configuration options for the ActivityPub relay.
 */
export interface RelayOptions {
  kv: KvStore;
  domain?: string;
}

/**
 * Base interface for ActivityPub relay implementations.
 */
export interface Relay {
  readonly domain: string;

  fetch(request: Request): Promise<Response>;
  setSubscriptionHandler(handler: SubscriptionRequestHandler): this;
}

/**
 * A Mastodon-compatible ActivityPub relay implementation.
 * This relay follows Mastodon's relay protocol for maximum compatibility
 * with Mastodon instances.
 *
 * @since 2.0.0
 */
export class MastodonRelay implements Relay {
  #federation: Federation<void>;
  #options: RelayOptions;
  #subscriptionHandler?: SubscriptionRequestHandler;

  constructor(options: RelayOptions) {
    this.#options = options;
    this.#federation = createFederation<void>({
      kv: options.kv,
    });

    // for only relay like relay/inbox or something?
    this.#federation.setInboxListeners("/users/{identifier}/inbox", "/inbox")
      .on(Follow, async (ctx, follow) => {
        if (follow.id == null || follow.objectId == null) return;
        const parsed = ctx.parseUri(follow.objectId);
        if (parsed?.type !== "actor") return;
        const recipient = await follow.getActor(ctx);
        if (
          recipient == null || recipient.id == null ||
          recipient.preferredUsername == null ||
          recipient.inboxId == null
        ) return;
        let approved = false;

        // Then check custom subscription handler if provided
        if (this.#subscriptionHandler) {
          approved = await this.#subscriptionHandler(
            ctx,
            recipient,
          );
        }
        // add subscriber
        if (approved) {
          options.kv.set(["follower", follow.id.href], recipient.toJsonLd());

          await ctx.sendActivity(
            { identifier: RELAY_SERVER_ACTOR },
            recipient,
            new Accept({
              id: new URL(`#accept`, ctx.getActorUri(RELAY_SERVER_ACTOR)),
              actor: follow.objectId,
              object: follow,
            }),
          );
        } else {
          await ctx.sendActivity(
            { identifier: RELAY_SERVER_ACTOR },
            recipient,
            new Reject({
              id: new URL(`#reject`, ctx.getActorUri(RELAY_SERVER_ACTOR)),
              actor: follow.objectId,
              object: follow,
            }),
          );
        }
      })
      .on(Undo, async (ctx, undo) => {
        const activity = await undo.getObject(ctx); // An `Activity` to undo
        if (activity instanceof Follow) {
          if (activity.id == null || activity.actorId == null) return;
          options.kv.delete(["follower", activity.id.href]);
        } else {
          console.warn(
            "Unsupported object type ({type}) for Undo activity: {object}",
            { type: activity?.constructor.name, object: activity },
          );
        }
      })
      .on(Create, async (ctx) => {
        await ctx.forwardActivity(
          { identifier: RELAY_SERVER_ACTOR },
          "followers",
        );
      })
      .on(Update, async (ctx) => {
        await ctx.forwardActivity(
          { identifier: RELAY_SERVER_ACTOR },
          "followers",
        );
      })
      .on(Move, async (ctx) => {
        await ctx.forwardActivity(
          { identifier: RELAY_SERVER_ACTOR },
          "followers",
        );
      })
      .on(Delete, async (ctx) => {
        await ctx.forwardActivity(
          { identifier: RELAY_SERVER_ACTOR },
          "followers",
        );
      });
  }

  get domain(): string {
    return this.#options.domain || "localhost";
  }

  fetch(request: Request): Promise<Response> {
    return this.#federation.fetch(request, { contextData: undefined });
  }

  setSubscriptionHandler(handler: SubscriptionRequestHandler): this {
    this.#subscriptionHandler = handler;
    return this;
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
  #federation: Federation<void>;
  #options: RelayOptions;
  #subscriptionHandler?: SubscriptionRequestHandler;

  constructor(options: RelayOptions) {
    this.#options = options;
    this.#federation = createFederation<void>({
      kv: options.kv,
    });
  }

  get domain(): string {
    return this.#options.domain || "localhost";
  }

  fetch(request: Request): Promise<Response> {
    return this.#federation.fetch(request, { contextData: undefined });
  }

  setSubscriptionHandler(handler: SubscriptionRequestHandler): this {
    this.#subscriptionHandler = handler;
    return this;
  }
}
