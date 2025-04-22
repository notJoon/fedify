import { assertEquals, assertExists } from "@std/assert";
import { parse } from "@std/semver";
import type { Protocol } from "../nodeinfo/types.ts";
import { test } from "../testing/mod.ts";
import { Activity, Note, Person } from "../vocab/vocab.ts";
import { createFederationBuilder } from "./builder.ts";
import type {
  ActorDispatcher,
  InboxListener,
  NodeInfoDispatcher,
  ObjectDispatcher,
} from "./callback.ts";
import { MemoryKvStore } from "./kv.ts";
import type { FederationImpl } from "./middleware.ts";

test("FederationBuilder", async (t) => {
  await t.step(
    "should build a Federation object with registered components",
    async () => {
      const builder = createFederationBuilder<string>();
      const kv = new MemoryKvStore();

      const actorDispatcher: ActorDispatcher<string> = (_ctx, _identifier) => {
        return null;
      };
      builder.setActorDispatcher("/users/{identifier}", actorDispatcher);

      const inboxListener: InboxListener<string, Activity> = (
        _ctx,
        _activity,
      ) => {
        // Do nothing
      };
      const listeners = builder.setInboxListeners("/users/{identifier}/inbox");
      listeners.on(Activity, inboxListener);

      const objectDispatcher: ObjectDispatcher<string, Note, string> = (
        _ctx,
        _values,
      ) => {
        return null;
      };
      builder.setObjectDispatcher(Note, "/notes/{id}", objectDispatcher);

      const nodeInfo = {
        version: "2.1",
        software: {
          name: "test",
          version: parse("1.0.0"),
        },
        protocols: ["activitypub"] as Protocol[],
        services: { inbound: [], outbound: [] },
        openRegistrations: false,
        usage: {
          users: {},
          localPosts: 0,
          localComments: 0,
        },
        metadata: {},
      };

      const nodeInfoDispatcher: NodeInfoDispatcher<string> = (_ctx) => nodeInfo;
      builder.setNodeInfoDispatcher("/nodeinfo", nodeInfoDispatcher);

      const federation = await builder.build({ kv });
      assertExists(federation);

      const impl = federation as FederationImpl<string>;

      assertEquals(impl.router.route("/users/test123")?.name, "actor");
      assertEquals(impl.router.route("/users/test123/inbox")?.name, "inbox");
      assertEquals(
        impl.router.route("/notes/456")?.name,
        `object:${Note.typeId.href}`,
      );
      assertEquals(impl.router.route("/nodeinfo")?.name, "nodeInfo");

      const actorCallbacksDispatcher = impl.actorCallbacks?.dispatcher;
      assertExists(actorCallbacksDispatcher);

      const inboxListeners = impl.inboxListeners;
      assertExists(inboxListeners);

      assertExists(impl.objectCallbacks[Note.typeId.href]);

      assertExists(impl.nodeInfoDispatcher);

      const notePaths = impl.router.build(`object:${Note.typeId.href}`, {
        id: "123",
      });
      assertEquals(notePaths, "/notes/123");

      assertEquals(
        impl.router.build("actor", { identifier: "user1" }),
        "/users/user1",
      );
      assertEquals(
        impl.router.build("inbox", { identifier: "user1" }),
        "/users/user1/inbox",
      );
    },
  );

  await t.step("should build with default options", async () => {
    const builder = createFederationBuilder<void>();
    const kv = new MemoryKvStore();
    const federation = await builder.build({ kv });

    assertExists(federation);
    const impl = federation as FederationImpl<void>;
    assertEquals(impl.kv, kv);
  });

  await t.step("should pass build options correctly", async () => {
    const builder = createFederationBuilder<number>();
    const kv = new MemoryKvStore();
    const federation = await builder.build({
      kv,
      kvPrefixes: { activityIdempotence: ["custom", "idem"] },
      allowPrivateAddress: true,
      trailingSlashInsensitive: true,
      origin: "https://example.com",
    });

    assertExists(federation);
    const impl = federation as FederationImpl<number>;

    assertEquals(impl.kv, kv);
    assertEquals(impl.kvPrefixes.activityIdempotence, ["custom", "idem"]);
    assertEquals(impl.allowPrivateAddress, true);
    assertEquals(impl.router.trailingSlashInsensitive, true);
    assertEquals(impl.origin?.webOrigin, "https://example.com");
  });

  await t.step(
    "should register multiple object dispatchers and verify them",
    async () => {
      const builder = createFederationBuilder<void>();
      const kv = new MemoryKvStore();

      const noteDispatcher: ObjectDispatcher<void, Note, string> = (
        _ctx,
        _values,
      ) => {
        return null;
      };

      const personDispatcher: ObjectDispatcher<void, Person, string> = (
        _ctx,
        _values,
      ) => {
        return null;
      };

      builder.setObjectDispatcher(Note, "/notes/{id}", noteDispatcher);
      builder.setObjectDispatcher(Person, "/people/{id}", personDispatcher);

      const federation = await builder.build({ kv });
      const impl = federation as FederationImpl<void>;

      assertExists(impl.objectCallbacks[Note.typeId.href]);
      assertExists(impl.objectCallbacks[Person.typeId.href]);

      const notePath = impl.router.build(`object:${Note.typeId.href}`, {
        id: "123",
      });
      assertEquals(notePath, "/notes/123");

      const personPath = impl.router.build(`object:${Person.typeId.href}`, {
        id: "456",
      });
      assertEquals(personPath, "/people/456");

      const noteRoute = impl.router.route("/notes/789");
      assertEquals(noteRoute?.name, `object:${Note.typeId.href}`);
      assertEquals(noteRoute?.values.id, "789");

      const personRoute = impl.router.route("/people/abc");
      assertEquals(personRoute?.name, `object:${Person.typeId.href}`);
      assertEquals(personRoute?.values.id, "abc");
    },
  );
});
