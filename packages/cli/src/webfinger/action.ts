import type { ResourceDescriptor } from "@fedify/fedify";
import {
  lookupWebFinger,
  type LookupWebFingerOptions,
} from "@fedify/fedify/webfinger";
import ora from "ora";
import { formatObject } from "../utils.ts";
import type { WebFingerCommand } from "./command.ts";
import { getErrorMessage, NotFoundError } from "./error.ts";
import { convertUrlIfHandle } from "./lib.ts";

export default async function runWebFinger(
  { command: _, resources, ...options }: WebFingerCommand,
) {
  await Array.fromAsync(
    resources.map((resource) => ({ resource, ...options })),
    spinnerWrapper(lookupSingleWebFinger),
  );
}

export async function lookupSingleWebFinger<
  T extends LookupWebFingerOptions & { resource: string },
>({ resource, ...options }: T): Promise<ResourceDescriptor> {
  const url = convertUrlIfHandle(resource);
  const webFinger = await lookupWebFinger(url, options) ??
    new NotFoundError(resource).throw();
  return webFinger;
}

function spinnerWrapper<F extends typeof lookupSingleWebFinger>(
  func: (...args: Parameters<F>) => ReturnType<F>,
) {
  return async (...args: Parameters<F>) => {
    const spinner = ora({
      text: `Looking up WebFinger for ${args[0]}`,
      discardStdin: false,
    }).start();
    try {
      const result = await func(...args);
      spinner.succeed(`WebFinger found for ${args[0]}:`);
      console.log(formatObject(result, undefined, true));
    } catch (error) {
      spinner.fail(getErrorMessage(args[0].resource, error));
    }
  };
}
