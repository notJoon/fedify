import { Command, EnumType } from "@cliffy/command";
import { openTunnel, type Tunnel } from "@hongminhee/localtunnel";
import ora from "ora";

const service = new EnumType(["localhost.run", "serveo.net"]);

export async function tunnelAction(
  options: { service?: "localhost.run" | "serveo.net" },
  port: number,
  deps: {
    openTunnel: typeof openTunnel;
    ora: typeof ora;
    console: typeof console;
    addSignalListener: typeof Deno.addSignalListener;
    exit: typeof Deno.exit;
  } = {
    openTunnel,
    ora,
    console,
    addSignalListener: Deno.addSignalListener,
    exit: Deno.exit,
  },
) {
  const spinner = deps.ora({
    text: "Creating a secure tunnel...",
    discardStdin: false,
  }).start();
  let tunnel: Tunnel;
  try {
    tunnel = await deps.openTunnel({ port, service: options.service });
  } catch {
    spinner.fail("Failed to create a secure tunnel.");
    deps.exit(1);
  }
  spinner.succeed(
    `Your local server at ${port} is now publicly accessible:\n`,
  );
  deps.console.log(tunnel.url.href);
  deps.console.error("\nPress ^C to close the tunnel.");
  deps.addSignalListener("SIGINT", async () => {
    await tunnel.close();
  });
}

export const command = new Command()
  .type("service", service)
  .arguments("<port:integer>")
  .description(
    "Expose a local HTTP server to the public internet using a secure tunnel.\n\n" +
      "Note that the HTTP requests through the tunnel have X-Forwarded-* headers.",
  )
  .option("-s, --service <service:service>", "The localtunnel service to use.")
  .action(tunnelAction);
