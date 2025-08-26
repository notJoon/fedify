import { strictEqual } from "node:assert/strict";
import { describe, test } from "node:test";
import { type ContextDataFactory, federation } from "./mod.ts";

interface MockHonoContext {
  req: {
    raw: Request;
  };
  res: Response;
}

interface MockFederation<T> {
  fetch(request: Request, options: unknown): Promise<Response>;
}

describe("federation middleware", () => {
  test("creates middleware function", () => {
    const mockFederation: MockFederation<undefined> = {
      fetch: () => Promise.resolve(new Response("OK")),
    };

    const contextDataFactory: ContextDataFactory<undefined, MockHonoContext> =
      () => undefined;

    const middleware = federation(mockFederation as never, contextDataFactory);
    strictEqual(typeof middleware, "function");
  });

  test("calls federation.fetch with correct parameters", async () => {
    let capturedRequest: Request | undefined;
    let capturedOptions: unknown;

    const mockFederation: MockFederation<string> = {
      fetch: (request, options) => {
        capturedRequest = request;
        capturedOptions = options;
        return Promise.resolve(new Response("Federation response"));
      },
    };

    const contextDataFactory: ContextDataFactory<string, MockHonoContext> =
      () => "test-context";

    const middleware = federation(mockFederation as never, contextDataFactory);

    const mockRequest = new Request("https://example.com/test");
    const mockContext: MockHonoContext = {
      req: { raw: mockRequest },
      res: new Response("Hono response"),
    };

    const result = await middleware(mockContext, () => Promise.resolve());

    strictEqual(capturedRequest, mockRequest);
    strictEqual(
      (capturedOptions as { contextData: string }).contextData,
      "test-context",
    );
    strictEqual(result?.status, 200);
  });

  test("handles async context data factory", async () => {
    let capturedContextData: unknown;

    const mockFederation: MockFederation<string> = {
      fetch: (_request, options) => {
        capturedContextData = (options as { contextData: string }).contextData;
        return Promise.resolve(new Response("OK"));
      },
    };

    const contextDataFactory: ContextDataFactory<string, MockHonoContext> =
      async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return "async-context";
      };

    const middleware = federation(mockFederation as never, contextDataFactory);

    const mockRequest = new Request("https://example.com/test");
    const mockContext: MockHonoContext = {
      req: { raw: mockRequest },
      res: new Response("Hono response"),
    };

    await middleware(mockContext, () => Promise.resolve());

    strictEqual(
      (capturedContextData as { contextData: string }).contextData,
      "async-context",
    );
  });
});
