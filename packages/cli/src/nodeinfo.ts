import { getNodeInfo, getUserAgent } from "@fedify/fedify";
import { createJimp } from "@jimp/core";
import webp from "@jimp/wasm-webp";
import {
  argument,
  command as Command,
  constant,
  flag,
  type InferValue,
  merge,
  message,
  object,
  option,
  optional,
  or,
  string,
} from "@optique/core";
import * as colors from "@std/fmt/colors";
import { defaultFormats, defaultPlugins, intToRGBA } from "jimp";
import ora from "ora";
import { debugOption } from "./globals.ts";
import { formatObject } from "./utils.ts";

export const Jimp = createJimp({
  formats: [...defaultFormats, webp],
  plugins: defaultPlugins,
});

const nodeInfoOption = optional(
  or(
    object({
      raw: flag("-r", "--raw", {
        description: message`Show NodeInfo document in the raw JSON format`,
      }),
    }),
    object({
      bestEffort: optional(flag("-b", "--best-effort", {
        description:
          message`Parse the NodeInfo document with best effort. If the NodeInfo document is not well-formed, the option will try to parse it as much as possible.`,
      })),
      noFavicon: optional(flag("--no-favicon", {
        description: message`Disable fetching the favicon of the instance`,
      })),
      metadata: optional(flag("-m", "--metadata", {
        description:
          message`show the extra metadata of the NodeInfo, i.e., the metadata field of the document.`,
      })),
    }),
  ),
);

const userAgentOption = optional(object({
  userAgent: option("-u", "--user-agent", string()),
}));

export const nodeInfoCommand = Command(
  "nodeinfo",
  merge(
    object({
      command: constant("nodeinfo"),
      host: argument(string({ metavar: "hostname or URL" }), {
        description: message`Bare hostname or a full URL of the instance`,
      }),
    }),
    debugOption,
    nodeInfoOption,
    userAgentOption,
  ),
  {
    description:
      message`Get information about a remote node using the NodeInfo protocol. The argument is the hostname of the remote node, or the URL of the remote node.`,
  },
);

export async function runNodeInfo(
  command: InferValue<typeof nodeInfoCommand>,
) {
  console.debug(command);
}

function indent(text: string, depth: number) {
  return text.replace(/\n/g, "\n" + " ".repeat(depth));
}

const LINK_REGEXP =
  /<link((?:\s+(?:[-a-z]+)=(?:"[^"]*"|'[^']*'|[^\s]+))*)\s*\/?>/ig;
const LINK_ATTRS_REGEXP = /(?:\s+([-a-z]+)=("[^"]*"|'[^']*'|[^\s]+))/ig;

export async function getFaviconUrl(
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

function checkTerminalColorSupport(): "truecolor" | "256color" | "none" {
  // Check if colors are explicitly disabled
  const noColor = Deno.env.get("NO_COLOR");
  if (noColor != null && noColor !== "") {
    return "none";
  }

  // Check for true color (24-bit) support
  const colorTerm = Deno.env.get("COLORTERM");
  if (
    colorTerm != null &&
    (colorTerm.includes("24bit") || colorTerm.includes("truecolor"))
  ) {
    return "truecolor";
  }

  // Check for xterm 256-color support
  const term = Deno.env.get("TERM");
  if (
    term != null &&
    (term.includes("256color") ||
      term.includes("xterm") ||
      term === "screen" ||
      term === "tmux")
  ) {
    return "256color";
  }

  // Fallback: assume basic color support if TERM is set
  if (term != null && term !== "dumb") {
    return "256color";
  }

  // Check for Windows Terminal support
  // FIXME: WT_SESSION is not a reliable way to check for Windows Terminal support
  const isWindows = Deno.build.os === "windows";
  const isWT = Deno.env.get("WT_SESSION");
  if (isWindows && isWT != null && isWT !== "") {
    return "truecolor";
  }

  return "none";
}

const DEFAULT_IMAGE_WIDTH = 38;

const ASCII_CHARS =
  // cSpell: disable
  "█▓▒░@#B8&WM%*oahkbdpqwmZO0QLCJUYXzcvunxrjft/\\|()1{}[]?-_+~<>i!lI;:,\"^`'. ";
// cSpell: enable

const CUBE_VALUES = [0, 95, 135, 175, 215, 255];

const findClosestIndex = (value: number): number => {
  let minDiff = Infinity;
  let closestIndex = 0;
  for (let idx = 0; idx < CUBE_VALUES.length; idx++) {
    const diff = Math.abs(value - CUBE_VALUES[idx]);
    if (diff < minDiff) {
      minDiff = diff;
      closestIndex = idx;
    }
  }
  return closestIndex;
};

export function rgbTo256Color(r: number, g: number, b: number): number {
  // Check if it's a grayscale color first (when all RGB values are very close)
  const gray = Math.round((r + g + b) / 3);
  const isGrayscale = Math.abs(r - gray) <= 5 && Math.abs(g - gray) <= 5 &&
    Math.abs(b - gray) <= 5;

  // Handle grayscale colors (colors 232-255) - but exclude exact cube values
  if (isGrayscale) {
    const isExactCubeValue = CUBE_VALUES.includes(r) && r === g && g === b;

    if (!isExactCubeValue) {
      if (gray < 8) return 232; // Darkest grayscale
      if (gray > 238) return 255; // Brightest grayscale

      // Map to grayscale range 232-255 (24 levels)
      // XTerm grayscale: 8, 18, 28, ..., 238 maps to 232, 233, 234, ..., 255
      const grayIndex = Math.round((gray - 8) / 10);
      return Math.max(232, Math.min(255, 232 + grayIndex));
    }
  }

  // Handle RGB colors (colors 16-231)
  // XTerm 256 color cube values: [0, 95, 135, 175, 215, 255]

  const r6 = findClosestIndex(r);
  const g6 = findClosestIndex(g);
  const b6 = findClosestIndex(b);

  return 16 + (36 * r6) + (6 * g6) + b6;
}

export function getAsciiArt(
  image: Awaited<ReturnType<typeof Jimp.read>>,
  width = DEFAULT_IMAGE_WIDTH,
  colorSupport: "truecolor" | "256color" | "none",
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

      if (colorSupport === "truecolor") {
        art += colors.rgb24(char, color);
      } else if (colorSupport === "256color") {
        const colorIndex = rgbTo256Color(color.r, color.g, color.b);
        art += colors.rgb8(char, colorIndex);
      } else {
        art += char;
      }
    }
    if (y < height - 1) art += "\n";
  }
  return art;
}
