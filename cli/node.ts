import { colors } from "@cliffy/ansi";
import { Command } from "@cliffy/command";
import { formatSemVer, getNodeInfo, getUserAgent } from "@fedify/fedify";
import { createJimp } from "@jimp/core";
import webp from "@jimp/wasm-webp";
import { getLogger } from "@logtape/logtape";
import { isICO, parseICO } from "icojs";
import { defaultFormats, defaultPlugins, intToRGBA } from "jimp";
import ora from "ora";
import { printJson } from "./utils.ts";

const logger = getLogger(["fedify", "cli", "node"]);

export const command = new Command()
  .arguments("<host:string>")
  .description(
    "Get information about a remote node using the NodeInfo protocol.  " +
      "The argument is the hostname of the remote node, or the URL of the " +
      "remote node.",
  )
  .option("-r, --raw", "Print the fetched NodeInfo document as is.")
  .option(
    "-b, --best-effort",
    "Try to parse the NodeInfo document even if it is invalid.",
    { conflicts: ["raw"] },
  )
  .option(
    "--no-favicon",
    "Do not display the favicon of the node.",
    { conflicts: ["raw"] },
  )
  .option(
    "-m, --metadata",
    "Print metadata fields of the NodeInfo document.",
    { conflicts: ["raw"] },
  )
  .option("-u, --user-agent <string>", "The custom User-Agent header value.")
  .action(async (options, host: string) => {
    const spinner = ora({
      text: "Fetching a NodeInfo document...",
      discardStdin: false,
    }).start();
    const url = new URL(URL.canParse(host) ? host : `https://${host}/`);
    if (options.raw) {
      const nodeInfo = await getNodeInfo(url, {
        parse: "none",
        userAgent: options.userAgent,
      });
      if (nodeInfo === undefined) {
        spinner.fail("No NodeInfo document found.");
        console.error("No NodeInfo document found.");
        Deno.exit(1);
      }
      spinner.succeed("NodeInfo document fetched.");
      printJson(nodeInfo);
      return;
    }
    const nodeInfo = await getNodeInfo(url, {
      parse: options.bestEffort ? "best-effort" : "strict",
      userAgent: options.userAgent,
    });
    logger.debug("NodeInfo document: {nodeInfo}", { nodeInfo });
    if (nodeInfo == undefined) {
      spinner.fail("No NodeInfo document found or it is invalid.");
      console.error("No NodeInfo document found or it is invalid.");
      if (!options.bestEffort) {
        console.error(
          "Use the -b/--best-effort option to try to parse the document anyway.",
        );
      }
      Deno.exit(1);
    }
    let layout: string[];
    let defaultWidth = 0;
    if (options.favicon) {
      spinner.text = "Fetching the favicon...";
      try {
        const faviconUrl = await getFaviconUrl(url, options.userAgent);
        const response = await fetch(faviconUrl, {
          headers: {
            "User-Agent": options.userAgent == null
              ? getUserAgent()
              : options.userAgent,
          },
        });
        if (response.ok) {
          const contentType = response.headers.get("Content-Type");
          let buffer: ArrayBuffer = await response.arrayBuffer();
          if (
            contentType === "image/vnd.microsoft.icon" ||
            contentType === "image/x-icon" ||
            isICO(buffer)
          ) {
            const images = await parseICO(buffer);
            if (images.length < 1) {
              throw new Error("No images found in the ICO file.");
            }
            buffer = images[0].buffer;
          }
          const image = await Jimp.read(buffer);
          const trueColorSupport = checkTerminalTrueColorSupport();
          layout = getAsciiArt(image, DEFAULT_IMAGE_WIDTH,trueColorSupport).split("\n").map((line) => ` ${line}  `);
          defaultWidth = 41;
        } else {
          logger.error(
            "Failed to fetch the favicon: {status} {statusText}",
            { status: response.status, statusText: response.statusText },
          );
          layout = [""];
        }
      } catch (error) {
        logger.error(
          "Failed to fetch or render the favicon: {error}",
          { error },
        );
        layout = [""];
      }
    } else {
      layout = [""];
    }
    spinner.succeed("NodeInfo document fetched.");
    console.log();
    let i = 0;
    const next = () => {
      i++;
      if (i >= layout.length) layout.push(" ".repeat(defaultWidth));
      return i;
    };
    layout[i] += colors.bold(url.host);
    layout[next()] += colors.dim("=".repeat(url.host.length));
    layout[next()] += colors.bold.dim("Software:");
    layout[next()] += `  ${nodeInfo.software.name} v${
      formatSemVer(nodeInfo.software.version)
    }`;
    if (nodeInfo.software.homepage != null) {
      layout[next()] += `  ${nodeInfo.software.homepage.href}`;
    }
    if (nodeInfo.software.repository != null) {
      layout[next()] += "  " +
        colors.dim(nodeInfo.software.repository.href);
    }
    if (nodeInfo.protocols.length > 0) {
      layout[next()] += colors.bold.dim("Protocols:");
      for (const protocol of nodeInfo.protocols) {
        layout[next()] += `  ${protocol}`;
      }
    }
    if (nodeInfo.services?.inbound?.length ?? 0 > 0) {
      layout[next()] += colors.bold.dim("Inbound services:");
      for (const service of nodeInfo.services?.inbound ?? []) {
        layout[next()] += `  ${service}`;
      }
    }
    if (nodeInfo.services?.outbound?.length ?? 0 > 0) {
      layout[next()] += colors.bold.dim("Outbound services:");
      for (const service of nodeInfo.services?.outbound ?? []) {
        layout[next()] += `  ${service}`;
      }
    }
    if (
      nodeInfo.usage?.users != null && (nodeInfo.usage.users.total != null ||
        nodeInfo.usage.users.activeHalfyear != null ||
        nodeInfo.usage.users.activeMonth != null)
    ) {
      layout[next()] += colors.bold.dim("Users:");
      if (nodeInfo.usage.users.total != null) {
        layout[next()] +=
          `  ${nodeInfo.usage.users.total.toLocaleString("en-US")} ` +
          colors.dim("(total)");
      }
      if (nodeInfo.usage.users.activeHalfyear != null) {
        layout[next()] +=
          `  ${nodeInfo.usage.users.activeHalfyear.toLocaleString("en-US")} ` +
          colors.dim("(active half year)");
      }
      if (nodeInfo.usage.users.activeMonth != null) {
        layout[next()] +=
          `  ${nodeInfo.usage.users.activeMonth.toLocaleString("en-US")} ` +
          colors.dim("(active month)");
      }
    }
    if (nodeInfo.usage?.localPosts != null) {
      layout[next()] += colors.bold.dim("Local posts: ");
      layout[next()] += "  " +
        nodeInfo.usage.localPosts.toLocaleString("en-US");
    }
    if (nodeInfo.usage?.localComments != null) {
      layout[next()] += colors.bold.dim("Local comments:");
      layout[next()] += "  " +
        nodeInfo.usage.localComments.toLocaleString("en-US");
    }
    if (nodeInfo.openRegistrations != null) {
      layout[next()] += colors.bold.dim("Open registrations:");
      layout[next()] += "  " + (nodeInfo.openRegistrations ? "Yes" : "No");
    }
    if (
      options.metadata &&
      nodeInfo.metadata != null && Object.keys(nodeInfo.metadata).length > 0
    ) {
      layout[next()] += colors.bold.dim("Metadata:");
      for (const [key, value] of Object.entries(nodeInfo.metadata)) {
        layout[next()] += `  ${colors.dim(key + ":")} ${
          indent(
            typeof value === "string"
              ? value
              : Deno.inspect(value, { colors: true }),
            defaultWidth + 4 + key.length,
          )
        }`;
      }
    }
    console.log(layout.join("\n"));
  });

function indent(text: string, depth: number) {
  return text.replace(/\n/g, "\n" + " ".repeat(depth));
}

const LINK_REGEXP =
  /<link((?:\s+(?:[-a-z]+)=(?:"[^"]*"|'[^']*'|[^\s]+))*)\s*\/?>/ig;
const LINK_ATTRS_REGEXP = /(?:\s+([-a-z]+)=("[^"]*"|'[^']*'|[^\s]+))/ig;

async function getFaviconUrl(
  url: string | URL,
  userAgent?: string,
): Promise<URL> {
  const response = await fetch(url, {
    headers: {
      "User-Agent": userAgent == null ? getUserAgent() : userAgent,
    },
  });
  const text = await response.text();
  for (const match of text.matchAll(LINK_REGEXP)) {
    const attrs: Record<string, string> = {};
    for (const attrMatch of match[1].matchAll(LINK_ATTRS_REGEXP)) {
      const [, key, value] = attrMatch;
      attrs[key] = value.startsWith('"') || value.startsWith("'")
        ? value.slice(1, -1)
        : value;
    }
    const rel = attrs.rel?.toLowerCase()?.trim()?.split(/\s+/) ?? [];
    if (!rel.includes("icon") && !rel.includes("apple-touch-icon")) continue;
    if ("sizes" in attrs && attrs.sizes.match(/\d+x\d+/)) {
      const [w, h] = attrs.sizes.split("x").map((v) => Number.parseInt(v));
      if (w < 38 || h < 19) continue;
    }
    if ("href" in attrs) {
      if (attrs.href.endsWith(".svg")) continue;
      return new URL(attrs.href, response.url);
    }
  }
  return new URL("/favicon.ico", response.url);
}

const Jimp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

function checkTerminalTrueColorSupport() {
  const colorTerm = Deno.env.get("COLORTERM");

  if (
    colorTerm == null ||
    !(colorTerm.includes("24bit") || colorTerm.includes("truecolor"))
  ) {
    return false;
  }
  return true;
}

const DEFAULT_IMAGE_WIDTH = 38;

const ASCII_CHARS =
  // cSpell: disable
  "█▓▒░@#B8&WM%*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
// cSpell: enable

function rgbTo256Color(r: number, g: number, b: number): number {
  // Handle grayscale colors (colors 232-255)
  const gray = Math.round((r + g + b) / 3);
  if (
    Math.abs(r - gray) < 10 && Math.abs(g - gray) < 10 &&
    Math.abs(b - gray) < 10
  ) {
    if (gray < 8) return 16; // Black
    if (gray > 248) return 231; // White
    return Math.round(((gray - 8) / 247) * 23) + 232;
  }

  // Handle RGB colors (colors 16-231)
  // Convert to 6x6x6 cube
  const r6 = Math.round((r / 255) * 5);
  const g6 = Math.round((g / 255) * 5);
  const b6 = Math.round((b / 255) * 5);

  return 16 + (36 * r6) + (6 * g6) + b6;
}

function getAsciiArt(
  image: Awaited<ReturnType<typeof Jimp.read>>,
  width = DEFAULT_IMAGE_WIDTH,
  trueColorSupport,
): string {
  const ratio = image.width / image.height;
  const height = Math.round(
    width / ratio * 0.5, // Multiply by 0.5 because characters are taller than they are wide.
  );
  image.resize({ w: width, h: height });
  let art = "";
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixel = image.getPixelColor(x, y);
      const color = intToRGBA(pixel);
      if (color.a < 1) {
        art += " ";
        continue;
      }
      const brightness = (color.r + color.g + color.b) / 3;
      const charIndex = Math.round(
        (brightness / 255) * (ASCII_CHARS.length - 1),
      );
      const char = ASCII_CHARS[charIndex];

      if (trueColorSupport) {
        art += colors.rgb24(char, color);
      } else {
        const colorIndex = rgbTo256Color(color.r, color.g, color.b);
        art += colors.rgb8(char, colorIndex);
      }
    }
    if (y < height - 1) art += "\n";
  }
  return art;
}
