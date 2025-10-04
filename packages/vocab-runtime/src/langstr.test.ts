import { deepStrictEqual } from "node:assert";
import { test } from "node:test";
import util from "node:util";
import { LanguageString } from "./langstr.ts";

test("new LanguageString()", () => {
  const langStr = new LanguageString("Hello", "en");
  deepStrictEqual(langStr.toString(), "Hello");
  deepStrictEqual(langStr.locale, new Intl.Locale("en"));

  deepStrictEqual(new LanguageString("Hello", new Intl.Locale("en")), langStr);
});

test("Deno.inspect(LanguageString)", () => {
  const langStr = new LanguageString("Hello, 'world'", "en");
  deepStrictEqual(
    util.inspect(langStr, { colors: false }),
    "<en> \"Hello, 'world'\"",
  );
});

test("util.inspect(LanguageString)", () => {
  const langStr = new LanguageString("Hello, 'world'", "en");
  deepStrictEqual(
    util.inspect(langStr, { colors: false }),
    "<en> \"Hello, 'world'\"",
  );
});
