import * as temporal from "@js-temporal/polyfill";
import { delay } from "@std/async/delay";
import { Database } from "bun:sqlite";
import { expect, test } from "bun:test";
import { SqliteKvStore } from "./bun.ts";

let Temporal: typeof temporal.Temporal;
if ("Temporal" in globalThis) {
  Temporal = globalThis.Temporal;
} else {
  Temporal = temporal.Temporal;
}

function getStore(): {
  db: Database;
  tableName: string;
  store: SqliteKvStore;
} {
  const db = new Database(":memory:");
  const tableName = `fedify_kv_test_${Math.random().toString(36).slice(5)}`;
  return {
    db,
    tableName,
    store: new SqliteKvStore(db, { tableName }),
  };
}

test("SqliteKvStore.initialize()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.initialize();
    const result = db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    expect(result).toBeDefined();
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore.get()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.initialize();
    const now = Temporal.Now.instant().epochMilliseconds;
    db.prepare(`
      INSERT INTO ${tableName} (key, value, created)
      VALUES (?, ?, ?)
    `).run(JSON.stringify(["foo", "bar"]), JSON.stringify(["foobar"]), now);
    expect(await store.get(["foo", "bar"])).toEqual(["foobar"]);

    db.prepare(`
      INSERT INTO ${tableName} (key, value, expires, created)
      VALUES (?, ?, ?, ?)
    `).run(
      JSON.stringify(["foo", "bar", "ttl"]),
      JSON.stringify(["foobar"]),
      now + 500,
      Temporal.Now.instant().epochMilliseconds,
    );
    await delay(500);
    expect(await store.get(["foo", "bar", "ttl"])).toBeUndefined();
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore.set()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["foo", "baz"], "baz");

    const result = db.prepare(`
      SELECT * FROM ${tableName}
      WHERE key = ?
    `).all(JSON.stringify(["foo", "baz"]));

    expect(result.length).toBe(1);
    expect(JSON.parse(result[0].key as string)).toEqual(["foo", "baz"]);
    expect(JSON.parse(result[0].value as string)).toBe("baz");
    expect(result[0].expires).toBeNull();

    await store.set(["foo", "qux"], "qux", {
      ttl: Temporal.Duration.from({ days: 1 }),
    });
    const result2 = db.prepare(`
      SELECT * FROM ${tableName}
      WHERE key = ?
    `).all(JSON.stringify(["foo", "qux"]));
    expect(result2.length).toBe(1);
    expect(JSON.parse(result2[0].key as string)).toEqual(["foo", "qux"]);
    expect(JSON.parse(result2[0].value as string)).toBe("qux");
    expect(
      (result2[0].expires as number) >=
        (result2[0].created as number) + 86400000,
    ).toBe(true);

    await store.set(["foo", "quux"], true);
    const result3 = db.prepare(`
      SELECT * FROM ${tableName}
      WHERE key = ?
    `).all(JSON.stringify(["foo", "quux"]));
    expect(result3.length).toBe(1);
    expect(JSON.parse(result3[0].key as string)).toEqual(["foo", "quux"]);
    expect(JSON.parse(result3[0].value as string)).toBe(true);
    expect(result3[0].expires).toBeNull();
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore.set() - upsert functionality", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["upsert"], "initial");
    expect(await store.get(["upsert"])).toBe("initial");
    await store.set(["upsert"], "updated");
    expect(await store.get(["upsert"])).toBe("updated");
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM ${tableName} WHERE key = ?
    `).get(JSON.stringify(["upsert"]));
    expect((result as { count: number }).count).toBe(1);
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore.delete()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.initialize();
    await store.delete(["foo", "qux"]);
    const result = db.prepare(`
      SELECT * FROM ${tableName}
      WHERE key = ?
    `).all(JSON.stringify(["foo", "qux"]));
    expect(result.length).toBe(0);

    db.prepare(`
      INSERT INTO ${tableName} (key, value, created)
      VALUES (?, ?, ?)
    `).run(
      JSON.stringify(["foo", "qux"]),
      JSON.stringify(["qux"]),
      Temporal.Now.instant().epochMilliseconds,
    );
    await store.delete(["foo", "qux"]);
    const result2 = db.prepare(`
      SELECT * FROM ${tableName}
      WHERE key = ?
    `).all(JSON.stringify(["foo", "qux"]));
    expect(result2.length).toBe(0);
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore.drop()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.drop();
    const result = db.query(`
      SELECT name FROM sqlite_master 
      WHERE type='table' AND name=?
    `).get(tableName);
    expect(result).toBeNull();
  } finally {
    db.close();
  }
});

test("SqliteKvStore.cas()", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["foo", "bar"], "foobar");
    expect(await store.cas(["foo", "bar"], "bar", "baz")).toBe(false);
    expect(await store.get(["foo", "bar"])).toBe("foobar");
    expect(await store.cas(["foo", "bar"], "foobar", "baz")).toBe(true);
    expect(await store.get(["foo", "bar"])).toBe("baz");
    await store.delete(["foo", "bar"]);
    expect(await store.cas(["foo", "bar"], "foobar", "baz")).toBe(false);
    expect(await store.get(["foo", "bar"])).toBeUndefined();
    expect(await store.cas(["foo", "bar"], undefined, "baz")).toBe(true);
    expect(await store.get(["foo", "bar"])).toBe("baz");
    expect(await store.cas(["foo", "bar"], "baz", undefined)).toBe(true);
    expect(await store.get(["foo", "bar"])).toBeUndefined();
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore - complex values", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["complex"], {
      nested: {
        value: "test",
      },
    });
    expect(await store.get(["complex"])).toEqual({
      nested: {
        value: "test",
      },
    });

    await store.set(["undefined"], undefined);
    expect(await store.get(["undefined"])).toBeUndefined();
    expect(await store.cas(["undefined"], undefined, "baz")).toBe(true);
    expect(await store.get(["undefined"])).toBe("baz");

    await store.set(["null"], null);
    expect(await store.get(["null"])).toBeNull();
    expect(await store.cas(["null"], null, "baz")).toBe(true);
    expect(await store.get(["null"])).toBe("baz");

    await store.set(["empty string"], "");
    expect(await store.get(["empty string"])).toBe("");
    expect(await store.cas(["empty string"], "", "baz")).toBe(true);
    expect(await store.get(["empty string"])).toBe("baz");

    await store.set(["array"], [1, 2, 3]);
    expect(await store.get(["array"])).toEqual([1, 2, 3]);
    expect(
      await store.cas(["array"], [1, 2, 3], [1, 2, 3, 4]),
    ).toBe(true);
    expect(await store.get(["array"])).toEqual([1, 2, 3, 4]);

    await store.set(["object"], { a: 1, b: 2 });
    expect(await store.get(["object"])).toEqual({ a: 1, b: 2 });
    expect(
      await store.cas(["object"], { a: 1, b: 2 }, { a: 1, b: 2, c: 3 }),
    ).toBe(true);
    expect(await store.get(["object"])).toEqual({ a: 1, b: 2, c: 3 });

    await store.set(["falsy", "false"], false);
    expect(await store.get(["falsy", "false"])).toBe(false);
    expect(await store.cas(["falsy", "false"], false, true)).toBe(true);
    expect(await store.get(["falsy", "false"])).toBe(true);

    await store.set(["falsy", "0"], 0);
    expect(await store.get(["falsy", "0"])).toBe(0);
    expect(await store.cas(["falsy", "0"], 0, 1)).toBe(true);
    expect(await store.get(["falsy", "0"])).toBe(1);
  } finally {
    await store.drop();
    db.close();
  }
});

test("SqliteKvStore.set() - preserves created timestamp on update", async () => {
  const { db, tableName, store } = getStore();
  try {
    await store.set(["timestamp-test"], "initial");
    const initialResult = db.prepare(`
      SELECT created, expires FROM ${tableName}
      WHERE key = ?
    `).get(JSON.stringify(["timestamp-test"]));

    const initialCreated = (initialResult as { created: number }).created;
    expect(initialCreated).toBeDefined();
    expect((initialResult as { expires: number | null }).expires).toBeNull();

    await delay(100);

    const ttl = Temporal.Duration.from({ seconds: 30 });
    await store.set(["timestamp-test"], "updated", { ttl });

    const updatedResult = db.prepare(`
      SELECT created, expires FROM ${tableName}
      WHERE key = ?
    `).get(JSON.stringify(["timestamp-test"]));

    expect((updatedResult as { created: number }).created).toBe(
      initialCreated,
      "Created timestamp should remain unchanged after update",
    );
  } finally {
    await store.drop();
    db.close();
  }
});
