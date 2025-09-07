export const getErrorMessage = (resource: string, error: unknown): string =>
  error instanceof InvalidHandleError
    ? `Invalid handle format: ${error.handle}`
    : error instanceof NotFoundError
    ? `Resource not found: ${error.resource}`
    : error instanceof Error
    ? `Error looking up WebFinger for ${resource}: ${error.message}`
    : `Error looking up WebFinger for ${resource}: ${error}`;

/**
 * Custom error class for invalid handle formats.
 * @param {string} handle The invalid handle that caused the error.
 * @extends {Error}
 */
export class InvalidHandleError extends Error {
  constructor(public handle: string) {
    super(`Invalid handle format: ${handle}`);
    this.name = "InvalidHandleError";
  }
  throw(): never {
    throw this;
  }
}

/**
 * Custom error class for not found resources.
 * @param {string} resource The resource that was not found.
 * @extends {Error}
 */
export class NotFoundError extends Error {
  constructor(public resource: string) {
    super(`Resource not found: ${resource}`);
    this.name = "NotFoundError";
  }
  throw(): never {
    throw this;
  }
}
