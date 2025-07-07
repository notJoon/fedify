import { Command } from "@cliffy/command";
import { lookupWebFinger } from "@fedify/fedify/webfinger";
import ora from "ora";
import { printJson } from "./utils.ts";

export const command = new Command()
  .arguments("<handle:string>")
  .description(
    "Look up a WebFinger resource by handle. The argument can be multiple.",
  )
  .option(
    "-a, --user-agent <userAgent:string>",
    "The user agent to use for the request.",
  )
  .option(
    "-p, --allow-private-address",
    "Allow private IP addresses in the URL.",
  )
  .action(async (options, handle: string) => {
    const spinner = ora({ // Create a spinner for the lookup process
      text: `Looking up WebFinger for ${handle}`,
      discardStdin: false,
    }).start();
    try {
      const url = convertHandleToUrl(handle); // Convert handle to URL
      const webFinger = await lookupWebFinger(url, options); // Look up WebFinger
      if (webFinger == null) { // If no WebFinger found,
        throw new Error(`No WebFinger found for ${handle}`); // throw an error
      }

      spinner.succeed(`WebFinger found for ${handle}:`); // Succeed the spinner
      printJson(webFinger); // Print the WebFinger
    } catch (error) {
      if (error instanceof InvalidHandleError) { // If the handle format is invalid,
        spinner.fail(`Invalid handle format: ${error.handle}`); // log error message with handle
      } else {
        spinner.fail( // For other errors, log the error message
          `Error looking up WebFinger for ${handle}: ${error}`,
        );
      }
    }
  });

/**
 * Regular expression to match a handle in the format `@username@domain`.
 * The username can contain any characters except `@`.
 * The domain must be match with `[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}`.
 */
const HANDLE_REGEX =
  /^@?([^@]+)@([-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6})$/;

/**
 * Custom error class for invalid handle formats.
 * @param handle The invalid handle that caused the error.
 * @extends {Error}
 */
class InvalidHandleError extends Error {
  constructor(public handle: string) {
    super(`Invalid handle format: ${handle}`);
    this.name = "InvalidHandleError";
  }
}

/**
 * Converts a handle in the format `@username@domain` to a URL.
 * The resulting URL will be in the format `https://domain/@username`.
 * @param handle The handle to convert, in the format `@username@domain`.
 * @returns A URL object representing the handle.
 * @throws {Error} If the handle format is invalid.
 * @example
 * ```ts
 * const url = convertHandleToUrl("@username@domain.com");
 * console.log(url.toString()); // "https://domain.com/@username"
 * ```
 */
function convertHandleToUrl(handle: string): URL {
  const match = handle.match(HANDLE_REGEX);
  if (!match) {
    throw new InvalidHandleError(handle);
  }

  const [, username, domain] = match;
  // Builds a URL like "https://domain.com/@username"
  return new URL(`https://${domain}/@${username}`);
}
