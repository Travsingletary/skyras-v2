export type MemoryKind = "plan" | "episode" | "asset" | "campaign" | "history";

export interface MemoryRecord {
  id: string;
  kind: MemoryKind;
  key: string;
  data: unknown;
  createdAt: string;
  updatedAt: string;
}

export interface MemoryClient {
  save(record: Omit<MemoryRecord, "createdAt" | "updatedAt">): Promise<MemoryRecord>;
  getByKey(kind: MemoryKind, key: string): Promise<MemoryRecord | null>;
  search(kind: MemoryKind, query: string): Promise<MemoryRecord[]>;
  getAll(kind: MemoryKind): Promise<MemoryRecord[]>;
}

import { loadStore, saveStore } from "./storage";

export const memoryClient: MemoryClient = {
  async save(record) {
    const store = await loadStore();
    store[record.kind] = store[record.kind] || [];
    const records = store[record.kind] as MemoryRecord[];
    const existingIndex = records.findIndex((r) => r.kind === record.kind && r.key === record.key);
    const now = new Date().toISOString();
    const full: MemoryRecord = {
      ...record,
      createdAt: existingIndex === -1 ? now : records[existingIndex].createdAt,
      updatedAt: now,
    };
    if (existingIndex === -1) {
      records.push(full);
    } else {
      records[existingIndex] = full;
    }
    await saveStore(store);
    return full;
  },

  async getByKey(kind, key) {
    const store = await loadStore();
    const records = (store[kind] as MemoryRecord[]) || [];
    return records.find((r) => r.key === key) || null;
  },

  async search(kind, query) {
    const q = query.toLowerCase();
    const store = await loadStore();
    const records = (store[kind] as MemoryRecord[]) || [];
    return records.filter((r) => JSON.stringify(r.data).toLowerCase().includes(q));
  },

  async getAll(kind) {
    const store = await loadStore();
    return ((store[kind] as MemoryRecord[]) || []).slice();
  },
};

export interface RunHistoryRecord {
  id: string;
  workflow: string;
  startedAt: string;
  finishedAt: string;
  input: unknown;
  output: unknown;
  status: "success" | "error";
  errorMessage?: string;
  project?: string;
}

export async function saveRunHistory(
  record: Omit<RunHistoryRecord, "id" | "startedAt" | "finishedAt">,
): Promise<RunHistoryRecord> {
  const now = new Date().toISOString();
  const full: RunHistoryRecord = {
    id: `run:${record.workflow}:${Date.now()}`,
    startedAt: now,
    finishedAt: now,
    ...record,
  };

  await memoryClient.save({
    id: full.id,
    kind: "history",
    key: full.id,
    data: full,
  });

  return full;
}

export async function getRunHistory(workflow?: string, project?: string): Promise<RunHistoryRecord[]> {
  const records = await memoryClient.getAll("history");
  return records
    .map((r) => r.data as RunHistoryRecord)
    .filter((r) => (workflow ? r.workflow === workflow : true))
    .filter((r) => (project ? r.project === project : true))
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1));
}
