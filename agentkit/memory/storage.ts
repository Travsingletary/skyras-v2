import fs from "fs/promises";
import path from "path";

const DATA_FILE = path.resolve(__dirname, "../../.agentkit-data.json");

export interface DiskStore {
  [kind: string]: unknown[];
}

async function readFile(): Promise<DiskStore> {
  try {
    const raw = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

async function writeFile(store: DiskStore): Promise<void> {
  await fs.mkdir(path.dirname(DATA_FILE), { recursive: true }).catch(() => {});
  await fs.writeFile(DATA_FILE, JSON.stringify(store, null, 2), "utf-8");
}

export async function loadStore(): Promise<DiskStore> {
  return readFile();
}

export async function saveStore(store: DiskStore): Promise<void> {
  await writeFile(store);
}

export async function appendRecord(kind: string, record: unknown): Promise<void> {
  const store = await readFile();
  store[kind] = store[kind] || [];
  (store[kind] as unknown[]).push(record);
  await writeFile(store);
}

export async function getRecords(kind: string, filters?: Record<string, unknown>): Promise<unknown[]> {
  const store = await readFile();
  const records = (store[kind] as unknown[]) || [];
  if (!filters) return records;
  return records.filter((rec: any) => {
    for (const [key, value] of Object.entries(filters)) {
      if (rec?.[key] !== value) return false;
    }
    return true;
  });
}
