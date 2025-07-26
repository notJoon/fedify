import { SqliteKvStore } from "@fedify/sqlite";
import * as temporal from "@js-temporal/polyfill";
import {
  assertEquals,
  assertStrictEquals,
} from "https://deno.land/std@0.218.0/assert/mod.ts";
import { delay } from "https://deno.land/std@0.218.0/async/delay.ts";
import { DB } from "https://deno.land/x/sqlite@v3.7.0/mod.ts";

let Temporal: typeof temporal.Temporal;
if ("Temporal" in globalThis) {
  Temporal = globalThis.Temporal;
} else {
  Temporal = temporal.Temporal;
}

function getStore(): {
  db: DB;
  tableName: string;
  store: SqliteKvStore;
} {
  const db = new DB(":memory:");
  const tableName = `fedify_kv_test_${Math.random().toString(36).slice(5)}`;
  return {
    db,
    tableName,
    store: new SqliteKvStore(db, { tableName }),
  };
}

Deno.test("SqliteKvStore.initialize()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.initialize();
    const result = db.queryEntries(
      `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `,
      [tableName],
    );
    assertEquals(result.length > 0, true);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore.get()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.initialize();
    const now = Temporal.Now.instant().epochMilliseconds;
    db.query(
      `
      INSERT INTO ${tableName} (key, value, created)
      VALUES (?, ?, ?)
    `,
      [JSON.stringify(["foo", "bar"]), JSON.stringify(["foobar"]), now],
    );
    assertEquals(await store.get(["foo", "bar"]), ["foobar"]);

    db.query(
      `
      INSERT INTO ${tableName} (key, value, expires, created)
      VALUES (?, ?, ?, ?)
    `,
      [
        JSON.stringify(["foo", "bar", "ttl"]),
        JSON.stringify(["foobar"]),
        now + 500,
        Temporal.Now.instant().epochMilliseconds,
      ],
    );
    await delay(500);
    assertStrictEquals(await store.get(["foo", "bar", "ttl"]), undefined);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore.set()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["foo", "baz"], "baz");

    const result = db.queryEntries(
      `
      SELECT * FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["foo", "baz"])],
    );

    assertEquals(result.length, 1);
    assertEquals(JSON.parse(result[0].key as string), ["foo", "baz"]);
    assertEquals(JSON.parse(result[0].value as string), "baz");
    assertEquals(result[0].expires, null);

    await store.set(["foo", "qux"], "qux", {
      ttl: Temporal.Duration.from({ days: 1 }),
    });
    const result2 = db.queryEntries(
      `
      SELECT * FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["foo", "qux"])],
    );
    assertEquals(result2.length, 1);
    assertEquals(JSON.parse(result2[0].key as string), ["foo", "qux"]);
    assertEquals(JSON.parse(result2[0].value as string), "qux");
    assertEquals(
      (result2[0].expires as number) >=
        (result2[0].created as number) + 86400000,
      true,
    );

    await store.set(["foo", "quux"], true);
    const result3 = db.queryEntries(
      `
      SELECT * FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["foo", "quux"])],
    );
    assertEquals(result3.length, 1);
    assertEquals(JSON.parse(result3[0].key as string), ["foo", "quux"]);
    assertEquals(JSON.parse(result3[0].value as string), true);
    assertEquals(result3[0].expires, null);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore.set() - upsert functionality", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["upsert"], "initial");
    assertStrictEquals(await store.get(["upsert"]), "initial");
    await store.set(["upsert"], "updated");
    assertStrictEquals(await store.get(["upsert"]), "updated");
    const result = db.queryEntries(
      `
      SELECT COUNT(*) as count FROM ${tableName} WHERE key = ?
    `,
      [JSON.stringify(["upsert"])],
    );
    assertEquals(result[0].count, 1);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore.delete()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.delete(["foo", "qux"]);
    const result = db.queryEntries(
      `
      SELECT * FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["foo", "qux"])],
    );
    assertEquals(result.length, 0);

    db.query(
      `
      INSERT INTO ${tableName} (key, value, created)
      VALUES (?, ?, ?)
    `,
      [
        JSON.stringify(["foo", "qux"]),
        JSON.stringify(["qux"]),
        Temporal.Now.instant().epochMilliseconds,
      ],
    );
    await store.delete(["foo", "qux"]);
    const result2 = db.queryEntries(
      `
      SELECT * FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["foo", "qux"])],
    );
    assertEquals(result2.length, 0);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore.drop()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.drop();
    const result = db.queryEntries(
      `
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `,
      [tableName],
    );
    assertEquals(result.length, 0);
  } finally {
    db.close();
  }
});

Deno.test("SqliteKvStore.cas()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["foo", "bar"], "foobar");
    assertEquals(await store.cas(["foo", "bar"], "bar", "baz"), false);
    assertStrictEquals(await store.get(["foo", "bar"]), "foobar");
    assertEquals(await store.cas(["foo", "bar"], "foobar", "baz"), true);
    assertStrictEquals(await store.get(["foo", "bar"]), "baz");
    await store.delete(["foo", "bar"]);
    assertEquals(await store.cas(["foo", "bar"], "foobar", "baz"), false);
    assertStrictEquals(await store.get(["foo", "bar"]), undefined);
    assertEquals(await store.cas(["foo", "bar"], undefined, "baz"), true);
    assertStrictEquals(await store.get(["foo", "bar"]), "baz");
    assertEquals(await store.cas(["foo", "bar"], "baz", undefined), true);
    assertStrictEquals(await store.get(["foo", "bar"]), undefined);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore - complex values", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["complex"], {
      nested: {
        value: "test",
      },
    });
    assertEquals(await store.get(["complex"]), {
      nested: {
        value: "test",
      },
    });

    await store.set(["undefined"], undefined);
    assertStrictEquals(await store.get(["undefined"]), undefined);
    assertEquals(await store.cas(["undefined"], undefined, "baz"), true);
    assertStrictEquals(await store.get(["undefined"]), "baz");

    await store.set(["null"], null);
    assertStrictEquals(await store.get(["null"]), null);
    assertEquals(await store.cas(["null"], null, "baz"), true);
    assertStrictEquals(await store.get(["null"]), "baz");

    await store.set(["empty string"], "");
    assertStrictEquals(await store.get(["empty string"]), "");
    assertEquals(await store.cas(["empty string"], "", "baz"), true);
    assertStrictEquals(await store.get(["empty string"]), "baz");

    await store.set(["array"], [1, 2, 3]);
    assertEquals(await store.get(["array"]), [1, 2, 3]);
    assertEquals(
      await store.cas(["array"], [1, 2, 3], [1, 2, 3, 4]),
      true,
    );
    assertEquals(await store.get(["array"]), [1, 2, 3, 4]);

    await store.set(["object"], { a: 1, b: 2 });
    assertEquals(await store.get(["object"]), { b: 2, a: 1 });
    assertEquals(
      await store.cas(["object"], { a: 1, b: 2 }, { a: 1, b: 2, c: 3 }),
      true,
    );
    assertEquals(await store.get(["object"]), { a: 1, b: 2, c: 3 });

    await store.set(["falsy", "false"], false);
    assertStrictEquals(await store.get(["falsy", "false"]), false);
    assertEquals(await store.cas(["falsy", "false"], false, true), true);
    assertStrictEquals(await store.get(["falsy", "false"]), true);

    await store.set(["falsy", "0"], 0);
    assertStrictEquals(await store.get(["falsy", "0"]), 0);
    assertEquals(await store.cas(["falsy", "0"], 0, 1), true);
    assertStrictEquals(await store.get(["falsy", "0"]), 1);
  } finally {
    await store.drop();
    db.close();
  }
});

Deno.test("SqliteKvStore.set() - preserves created timestamp on update", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["timestamp-test"], "initial");
    const initialResult = db.queryEntries(
      `
      SELECT created, expires FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["timestamp-test"])],
    );

    const initialCreated = initialResult[0].created as number;
    assertEquals(
      initialCreated !== undefined,
      true,
      "Initial created timestamp should be set",
    );
    assertStrictEquals(
      initialResult[0].expires,
      null,
    );

    await delay(100);

    const ttl = Temporal.Duration.from({ seconds: 30 });
    await store.set(["timestamp-test"], "updated", { ttl });

    const updatedResult = db.queryEntries(
      `
      SELECT created, expires FROM ${tableName}
      WHERE key = ?
    `,
      [JSON.stringify(["timestamp-test"])],
    );

    assertEquals(
      updatedResult[0].created as number,
      initialCreated,
      "Created timestamp should remain unchanged after update",
    );
  } finally {
    await store.drop();
    db.close();
  }
});
