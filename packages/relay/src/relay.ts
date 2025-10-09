import {
  type Context,
  createFederation,
  type Federation,
  type KvStore,
} from "@fedify/fedify";
import {
  Accept,
  type Actor,
  Application,
  Create,
  Delete,
  Endpoints,
  Follow,
  isActor,
  Move,
  Object,
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

    this.#federation.setActorDispatcher(
      "/users/{identifier}",
      (ctx, identifier) => {
        if (identifier !== RELAY_SERVER_ACTOR) return null;
        return new Application({
          id: ctx.getActorUri(identifier),
          preferredUsername: identifier,
          name: "ActivityPub Relay",
          summary: "Mastodon-compatible ActivityPub relay server",
          inbox: ctx.getInboxUri(identifier),
          endpoints: new Endpoints({
            sharedInbox: ctx.getInboxUri(),
          }),
          followers: ctx.getFollowersUri(identifier),
          url: ctx.getActorUri(identifier),
        });
      },
    );

    this.#federation.setFollowersDispatcher(
      "/users/{identifier}/followers",
      async (_ctx, identifier) => {
        if (identifier !== RELAY_SERVER_ACTOR) return null;

        const activityIds = await options.kv.get<string[]>(["followers"]) ?? [];
        const actors: Actor[] = [];
        for (const activityId of activityIds) {
          const actorJson = await options.kv.get(["follower", activityId]);
          const actor = await Object.fromJsonLd(actorJson);
          if (!isActor(actor)) continue;
          actors.push(actor);
        }

        return { items: actors };
      },
    );

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

        if (this.#subscriptionHandler) {
          approved = await this.#subscriptionHandler(
            ctx,
            recipient,
          );
        }

        if (approved) {
          const followers = await options.kv.get<string[]>(["followers"]) ?? [];
          followers.push(follow.id.href);
          options.kv.set(["followers"], followers);
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
        const activity = await undo.getObject(ctx);
        if (activity instanceof Follow) {
          if (
            activity.id == null ||
            activity.actorId == null
          ) return;
          const activityId = activity.id.href;
          const followers = await options.kv.get<string[]>(["followers"]) ??
            [];
          const updatedFollowers = followers.filter((id) => id !== activityId);
          await options.kv.set(["followers"], updatedFollowers);
          options.kv.delete(["follower", activityId]);
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
