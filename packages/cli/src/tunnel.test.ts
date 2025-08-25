import type { Tunnel, TunnelOptions } from "@hongminhee/localtunnel";
import { assert, assertEquals, assertFalse, assertRejects } from "@std/assert";
import { assertSpyCall, stub } from "@std/testing/mock";
import type { Ora } from "ora";
import { command, tunnelAction } from "./tunnel.ts";

Deno.test("tunnel description", () => {
  // Test that the command is properly configured
  assert(
    command.getDescription().includes(
      "Expose a local HTTP server to the public internet using a secure tunnel.\n\n" +
        "Note that the HTTP requests through the tunnel have X-Forwarded-* headers.",
    ),
  );
});

Deno.test("tunnel command validates port argument", async () => {
  const exitStub = stub(Deno, "exit", () => {
    throw new Error("Process would exit");
  });

  try {
    await assertRejects(
      () => command.parse(["invalid-port"]),
      Error,
      "Process would exit",
    );
    assertSpyCall(exitStub, 0, { args: [2] });
  } finally {
    exitStub.restore();
  }
});

Deno.test("tunnel successfully creates and manages tunnel", async () => {
  // Track function calls
  let openTunnelCalled = false;
  let openTunnelArgs: TunnelOptions[] = [];
  let startCalled = false;
  let succeedCalled = false;
  let succeedArgs: string[] = [];
  let logArgs: string[] = [];
  let errorArgs: string[] = [];
  let addSignalListenerCalled = false;
  let exitCalled = false;

  // Create a mock tunnel object
  const mockTunnel = {
    url: new URL("https://abc123.localhost.run"),
    localPort: 3000,
    pid: 12345,
    close: () => Promise.resolve(),
  };

  // Create mock dependencies
  const mockDeps = {
    openTunnel: (args: TunnelOptions) => {
      openTunnelCalled = true;
      openTunnelArgs = [args];
      return Promise.resolve(mockTunnel as Tunnel);
    },
    ora: () => ({
      start() {
        startCalled = true;
        return this;
      },
      succeed(...args: string[]) {
        succeedCalled = true;
        succeedArgs = args;
        return this;
      },
      fail() {
        return this;
      },
    } as unknown as Ora),
    console: {
      log: (...args: string[]) => {
        logArgs = args;
      },
      error: (...args: string[]) => {
        errorArgs = args;
      },
    } as Console,
    addSignalListener: (() => {
      addSignalListenerCalled = true;
    }) as typeof Deno.addSignalListener,
    exit: (() => {
      exitCalled = true;
    }) as typeof Deno.exit,
  };

  await tunnelAction({ service: undefined }, 3000, mockDeps);

  // Verify all the expected interactions occurred
  assert(openTunnelCalled);
  assertEquals(openTunnelArgs, [{ port: 3000, service: undefined }]);
  assert(startCalled);
  assert(succeedCalled);
  assertEquals(succeedArgs, [
    "Your local server at 3000 is now publicly accessible:\n",
  ]);
  assertEquals(logArgs, ["https://abc123.localhost.run/"]);
  assertEquals(errorArgs, ["\nPress ^C to close the tunnel."]);
  assert(addSignalListenerCalled);
  assertFalse(exitCalled);
});

Deno.test("tunnel fails to create a secure tunnel and handles error", async () => {
  const exitStub = stub(Deno, "exit", () => {
    throw new Error("Process would exit");
  });

  // Track function calls
  let openTunnelCalled = false;
  let openTunnelArgs: TunnelOptions[] = [];
  let startCalled = false;
  let failCalled = false;
  let failArgs: string[] = [];
  let addSignalListenerCalled = false;

  const tunnelError = new Error("Failed to create a secure tunnel.");

  // Create mock dependencies that simulate failure
  const mockDeps = {
    openTunnel: (args: TunnelOptions) => {
      openTunnelCalled = true;
      openTunnelArgs = [args];
      return Promise.reject(tunnelError);
    },
    ora: () => ({
      start() {
        startCalled = true;
        return this;
      },
      succeed() {
        return this;
      },
      fail(...args: string[]) {
        failCalled = true;
        failArgs = args;
        return this;
      },
    } as unknown as Ora),
    console: {
      log: () => {},
      error: () => {},
    } as Console,
    addSignalListener: (() => {
      addSignalListenerCalled = true;
    }) as typeof Deno.addSignalListener,
    exit: (() => {
      throw new Error("Process would exit");
    }) as typeof Deno.exit,
  };

  try {
    await assertRejects(
      () => tunnelAction({ service: undefined }, 3000, mockDeps),
      Error,
      "Process would exit",
    );
  } finally {
    exitStub.restore();
  }

  // Verify error handling interactions
  assert(openTunnelCalled);
  assertEquals(openTunnelArgs, [{ port: 3000, service: undefined }]);
  assert(startCalled);
  assert(failCalled);
  assertEquals(failArgs, ["Failed to create a secure tunnel."]);
  assertFalse(addSignalListenerCalled);
});
