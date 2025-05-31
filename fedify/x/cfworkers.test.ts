import type { KVNamespace } from "@cloudflare/workers-types/experimental";
import { assertEquals } from "@std/assert";
import { test } from "../testing/mod.ts";
import { WorkersKvStore } from "./cfworkers.ts";

test({
  name: "WorkersKvStore",
  ignore: !("navigator" in globalThis &&
    navigator.userAgent === "Cloudflare-Workers"),
  async fn(t) {
    const { env } = t as unknown as {
      env: Record<string, KVNamespace<string>>;
    };
    const store = new WorkersKvStore(env.KV1);

    await t.step("set() & get()", async () => {
      await store.set(["foo", "bar"], { foo: 1, bar: 2 });
      assertEquals(await store.get(["foo", "bar"]), { foo: 1, bar: 2 });
      assertEquals(await store.get(["foo"]), undefined);

      await store.set(["foo", "baz"], "baz", {
        ttl: Temporal.Duration.from({ seconds: 0 }),
      });
      assertEquals(await store.get(["foo", "baz"]), undefined);
    });

    await t.step("delete()", async () => {
      await store.delete(["foo", "bar"]);
      assertEquals(await store.get(["foo", "bar"]), undefined);
    });
  },
});
