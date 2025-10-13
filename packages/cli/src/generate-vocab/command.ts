import {
  command,
  constant,
  type InferValue,
  message,
  object,
  option,
} from "@optique/core";
import { path } from "@optique/run";

const schemaDir = option(
  "-i",
  "--input",
  path({ metavar: "DIR", type: "directory", mustExist: true }),
);
const generatedPath = option(
  "-o",
  "--output",
  path({ metavar: "PATH", type: "file", allowCreate: true }),
);

const generateVocabCommand = command(
  "generate-vocab",
  object({
    command: constant("generate-vocab"),
    schemaDir,
    generatedPath,
  }),
  {
    description: message`Generate vocabulary classes from schema files.`,
  },
);

export default generateVocabCommand;

export type GenerateVocabCommand = InferValue<typeof generateVocabCommand>;
