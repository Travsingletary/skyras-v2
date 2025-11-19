import fs from "node:fs/promises";
import path from "node:path";

export async function readTextFile(filePath: string): Promise<string> {
  const resolved = path.resolve(process.cwd(), filePath);
  return fs.readFile(resolved, "utf-8");
}

export async function writeTextFile(filePath: string, contents: string): Promise<void> {
  const resolved = path.resolve(process.cwd(), filePath);
  await fs.mkdir(path.dirname(resolved), { recursive: true });
  await fs.writeFile(resolved, contents, "utf-8");
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    const resolved = path.resolve(process.cwd(), filePath);
    await fs.access(resolved);
    return true;
  } catch {
    return false;
  }
}

export async function listFiles(directory: string): Promise<string[]> {
  const resolved = path.resolve(process.cwd(), directory);
  return fs.readdir(resolved);
}
