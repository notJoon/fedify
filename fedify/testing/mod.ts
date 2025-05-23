import {
  configure,
  getConsoleSink,
  type LogRecord,
  reset,
  type Sink,
} from "@logtape/logtape";
import { test as nodeTest, type TestContext } from "node:test";

export function test(options: Deno.TestDefinition): void;
export function test(
  name: string,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void;
export function test(
  name: string,
  options: Omit<Deno.TestDefinition, "fn" | "name">,
  fn: (t: Deno.TestContext) => void | Promise<void>,
): void;
export function test(
  name: string | Deno.TestDefinition,
  options?:
    | ((
      t: Deno.TestContext,
    ) => void | Promise<void>)
    | Omit<Deno.TestDefinition, "fn" | "name">,
  fn?: (t: Deno.TestContext) => void | Promise<void>,
): void {
  const def: Deno.TestDefinition = typeof name === "string"
    ? typeof options === "function"
      ? { name, fn: options }
      : { name, ...options, fn: fn! }
    : (name satisfies Deno.TestDefinition);
  const func: (t: Deno.TestContext) => void | Promise<void> = def.fn;
  if ("Deno" in globalThis) {
    Deno.test({
      ...def,
      async fn(t: Deno.TestContext) {
        const records: LogRecord[] = [];
        await configure({
          sinks: {
            buffer(record: LogRecord): void {
              if (
                record.category.length > 1 &&
                record.category[0] === "logtape" &&
                record.category[1] === "meta"
              ) return;
              records.push(record);
            },
            console: getConsoleSink(),
          },
          filters: {},
          loggers: [
            {
              category: [],
              sinks: [Deno.env.get("LOG") === "always" ? "console" : "buffer"],
            },
          ],
        });
        try {
          await func(t);
        } catch (e) {
          const consoleSink: Sink = getConsoleSink();
          for (const record of records) consoleSink(record);
          throw e;
        } finally {
          await reset();
        }
      },
    });
  } else {
    nodeTest(def.name, { only: def.only, skip: def.ignore }, async (t) => {
      await def.fn(intoDenoTestContext(def.name, t));
    });
  }
}

function intoDenoTestContext(
  name: string,
  ctx: TestContext,
): Deno.TestContext {
  function step(def: Deno.TestStepDefinition): Promise<boolean>;
  function step(
    name: string,
    fn: (ctx: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean>;
  function step(
    fn: (ctx: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean>;
  async function step(
    defOrNameOrFn:
      | Deno.TestStepDefinition
      | string
      | ((ctx: Deno.TestContext) => void | Promise<void>),
    fn?: (ctx: Deno.TestContext) => void | Promise<void>,
  ): Promise<boolean> {
    let def: Deno.TestStepDefinition;
    if (typeof defOrNameOrFn === "string") {
      def = { name: defOrNameOrFn, fn: fn! };
    } else if (typeof defOrNameOrFn === "function") {
      def = { name: defOrNameOrFn.name, fn: defOrNameOrFn };
    } else {
      def = defOrNameOrFn;
    }
    let failed = false;
    await ctx.test(def.name, async (ctx2) => {
      try {
        await def.fn(intoDenoTestContext(def.name, ctx2));
      } catch (e) {
        failed = true;
        throw e;
      }
    });
    return failed;
  }
  const denoCtx: Deno.TestContext = {
    name,
    origin: ctx.filePath ?? "",
    step,
  };
  return denoCtx;
}
