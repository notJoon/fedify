import { getDocumentLoader } from "@fedify/fedify";
import { type Actor, isActor, lookupObject } from "@fedify/vocab";
import { spawn, spawnSync } from "node:child_process";
import type { Readable } from "node:stream";

const DEV_COMMAND: string[] = /* dev command */;
const HANDLE = "john";
const STARTUP_TIMEOUT = 15_000;
const IS_WINDOWS = process.platform === "win32";

async function main(): Promise<void> {
  const [command, ...args] = DEV_COMMAND;
  const server = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    shell: IS_WINDOWS,
    windowsHide: true,
    detached: !IS_WINDOWS,
  });
  server.on("error", () => {});

  const exitOnSignal = () => {
    stopServer(server);
    process.exit(1);
  };
  process.once("SIGINT", exitOnSignal);
  process.once("SIGTERM", exitOnSignal);

  let output = "";
  const collectOutput = (stream: Readable | null) => {
    const decoder = new TextDecoder();
    stream?.on("data", (chunk: Buffer) => {
      output += decoder.decode(chunk, { stream: true });
    });
  };
  collectOutput(server.stdout);
  collectOutput(server.stderr);

  try {
    const port = await determinePort(server);
    const target = `http://localhost:${port}/users/${HANDLE}`;
    await waitForServer(target);
    console.log(`Server is up at http://localhost:${port}.`);
    const actor = await checkActor(target);
    console.log(actor);
    console.log(`Smoke test passed: ${target} resolved to an actor.`);
  } catch (error) {
    console.error("Smoke test failed:", error instanceof Error ? error.message : error);
    if (output.trim() !== "") {
      console.error(`\nDev server output:\n${output}`);
    }
    process.exitCode = 1;
  } finally {
    stopServer(server);
  }
}

function stripEscape(text: string): string {
  return text.replace(new RegExp("\\u001B\\[[0-9;]*[A-Za-z]", "g"), "");
}

function determinePort(server: ReturnType<typeof spawn>): Promise<number> {
  const portPatterns = [
    /listening on.*:(\d+)/i,
    /server.*:(\d+)/i,
    /https?:\/\/localhost:(\d+)/i,
    /https?:\/\/0\.0\.0\.0:(\d+)/i,
    /https?:\/\/127\.0\.0\.1:(\d+)/i,
    /https?:\/\/[^:]+:(\d+)/i,
  ];
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(
        new Error(
          `Timeout: Could not determine port from server output within ${STARTUP_TIMEOUT}ms.`,
        ),
      );
    }, STARTUP_TIMEOUT);

    const findPort = (text: string) => {
      for (const pattern of portPatterns) {
        const match = text.match(pattern);
        if (match && match[1]) {
          const port = Number.parseInt(match[1], 10);
          if (port > 0 && port < 65536) return port;
        }
      }
      return null;
    };

    const scan = (stream: Readable | null) => {
      const decoder = new TextDecoder();
      let text = "";
      stream?.on("data", (chunk: Buffer) => {
        text += decoder.decode(chunk, { stream: true });
        const port = findPort(stripEscape(text));
        if (port != null) {
          clearTimeout(timeout);
          resolve(port);
        }
      });
    };

    scan(server.stdout);
    scan(server.stderr);
    server.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`The dev server exited early with code ${String(code)}.`));
    });
  });
}

async function waitForServer(url: string): Promise<void> {
  const startTime = Date.now();
  let lastStatus: number | undefined;

  while (Date.now() - startTime < STARTUP_TIMEOUT) {
    try {
      const response = await fetch(url, {
        headers: { Accept: "application/activity+json" },
        signal: AbortSignal.timeout(1000),
      });
      await response.body?.cancel();
      if (response.ok) return;
      lastStatus = response.status;
    } catch {
      // Server not ready yet, continue waiting
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  throw new Error(
    `The server did not become ready within ${STARTUP_TIMEOUT}ms.` +
      (lastStatus == null ? "" : `  Last response status: ${lastStatus}.`),
  );
}

async function checkActor(url: string): Promise<Actor> {
  const object = await lookupObject(url, {
    documentLoader: getDocumentLoader({ allowPrivateAddress: true }),
  });
  if (object == null) {
    throw new Error(`Could not resolve an actor at ${url}.`);
  }
  if (!isActor(object)) {
    throw new Error(`Expected an actor at ${url}, but got a non-actor object.`);
  }
  return object;
}

function stopServer(server: ReturnType<typeof spawn>): void {
  if (server.pid == null) return;
  if (IS_WINDOWS) {
    spawnSync("taskkill", ["/pid", String(server.pid), "/T", "/F"], {
      stdio: "ignore",
      windowsHide: true,
    });
    return;
  }
  try {
    process.kill(-server.pid, "SIGKILL");
  } catch {
    // Process group already exited.
  }
  try {
    server.kill("SIGKILL");
  } catch {
    // Process already exited.
  }
}

await main();
