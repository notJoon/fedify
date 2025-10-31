import envPaths from "env-paths";
import { mkdir } from "node:fs/promises";

const paths = envPaths("fedify", { suffix: "" });
export const DEFAULT_CACHE_DIR = paths.cache;

let currentCacheDir: string = DEFAULT_CACHE_DIR;

export async function getCacheDir(): Promise<string> {
  await mkdir(currentCacheDir, { recursive: true });
  return currentCacheDir;
}

export function setCacheDir(dir: string): Promise<void> {
  currentCacheDir = dir;
  return Promise.resolve();
}
