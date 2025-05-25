import jsonPreserveIndent from "json-preserve-indent";
import metadata from "../deno.json" with { type: "json" };

const packageJsonPath = `${import.meta.dirname}/../package.json`;
const packageJson = await Deno.readTextFile(packageJsonPath);
const data = jsonPreserveIndent(packageJson);
data.set("version", metadata.version);
await Deno.writeTextFile(packageJsonPath, data.format());
