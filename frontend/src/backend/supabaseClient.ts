import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Browser-compatible UUID generator
function randomUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

type TableRow = Record<string, any>;

interface TableApi {
  insert: (payload: TableRow | TableRow[]) => Promise<{ data: TableRow[]; error: Error | null }>;
  upsert: (payload: TableRow | TableRow[]) => Promise<{ data: TableRow[]; error: Error | null }>;
  select: (filters?: Record<string, unknown>) => Promise<{ data: TableRow[]; error: Error | null }>;
  update: (values: TableRow, filters: Record<string, unknown>) => Promise<{ data: TableRow[]; error: Error | null }>;
}

export interface SupabaseClientLike {
  from: (table: string) => TableApi;
  rpc: <T = unknown>(fn: string, args?: Record<string, unknown>) => Promise<{ data: T | null; error: Error | null }>;
}

let supabaseJsClient: SupabaseClient | null = null;

function buildSelect<T extends TableRow>(client: SupabaseClient, table: string, filters?: Record<string, unknown>) {
  let query = client.from(table).select("*");
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        query = query.in(key, value as any[]);
      } else {
        query = query.eq(key, value as any);
      }
    });
  }
  return query;
}

class MockSupabaseClient implements SupabaseClientLike {
  private store: Record<string, TableRow[]> = {};

  private ensureTable(table: string) {
    if (!this.store[table]) {
      this.store[table] = [];
    }
    return this.store[table]!;
  }

  private matchesFilters(row: TableRow, filters?: Record<string, unknown>) {
    if (!filters) return true;
    return Object.entries(filters).every(([key, value]) => {
      if (Array.isArray(value)) {
        return (value as unknown[]).includes(row[key]);
      }
      return row[key] === value;
    });
  }

  private normalizeRows(payload: TableRow | TableRow[]) {
    return Array.isArray(payload) ? payload : [payload];
  }

  private upsertRows(table: string, rows: TableRow[]) {
    const existing = this.ensureTable(table);
    const results: TableRow[] = [];

    rows.forEach((row) => {
      const normalized: TableRow = {
        id: row.id ?? randomUUID(),
        created_at: row.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...row,
      };

      const matchIndex = existing.findIndex((existingRow) => {
        if (row.project_id && row.file_path) {
          return existingRow.project_id === row.project_id && existingRow.file_path === row.file_path;
        }
        if (row.id) {
          return existingRow.id === row.id;
        }
        return false;
      });

      if (matchIndex >= 0) {
        existing[matchIndex] = { ...existing[matchIndex], ...normalized, updated_at: new Date().toISOString() };
      } else {
        existing.push(normalized);
      }
      results.push(normalized);
    });

    return results;
  }

  from(table: string): TableApi {
    return {
      insert: async (payload) => {
        const rows = this.normalizeRows(payload).map((row) => ({
          id: row.id ?? randomUUID(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...row,
        }));
        const bucket = this.ensureTable(table);
        bucket.push(...rows);
        return { data: rows, error: null };
      },
      upsert: async (payload) => {
        const rows = this.normalizeRows(payload);
        const data = this.upsertRows(table, rows);
        return { data, error: null };
      },
      select: async (filters) => {
        const rows = this.ensureTable(table).filter((row) => this.matchesFilters(row, filters));
        return { data: rows, error: null };
      },
      update: async (values, filters) => {
        const rows = this.ensureTable(table);
        const updated: TableRow[] = [];
        rows.forEach((row, index) => {
          if (this.matchesFilters(row, filters)) {
            rows[index] = { ...row, ...values, updated_at: new Date().toISOString() };
            updated.push(rows[index]);
          }
        });
        return { data: updated, error: null };
      },
    };
  }

  async rpc<T = unknown>(_fn: string, _args?: Record<string, unknown>): Promise<{ data: T | null; error: Error | null }> {
    return {
      data: null,
      error: new Error('Supabase RPC is not implemented in MockSupabaseClient'),
    };
  }
}

let cachedClient: SupabaseClientLike | null = null;

export function getSupabaseClient(): SupabaseClientLike {
  if (cachedClient) return cachedClient;

  const url = process.env.SUPABASE_URL;
  // Prefer SUPABASE_SERVICE_ROLE_KEY (SUPABASE_SECRET_KEY supported for backwards compatibility)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (url && key) {
    const client = createClient(url, key, { auth: { persistSession: false } });
    supabaseJsClient = client;
    cachedClient = {
      from: (table: string) => ({
        insert: async (payload) => {
          const { data, error } = await client.from(table).insert(payload).select();
          return { data: (data as TableRow[]) ?? [], error: error as Error | null };
        },
        upsert: async (payload) => {
          const { data, error } = await client.from(table).upsert(payload).select();
          return { data: (data as TableRow[]) ?? [], error: error as Error | null };
        },
        select: async (filters) => {
          const { data, error } = await buildSelect(client, table, filters);
          return { data: (data as TableRow[]) ?? [], error: error as Error | null };
        },
        update: async (values, filters) => {
          let query = client.from(table).update(values).select();
          if (filters) {
            Object.entries(filters).forEach(([key, value]) => {
              if (Array.isArray(value)) {
                query = query.in(key, value as any[]);
              } else {
                query = query.eq(key, value as any);
              }
            });
          }
          const { data, error } = await query;
          return { data: (data as TableRow[]) ?? [], error: error as Error | null };
        },
      }),
      rpc: async <T = unknown>(fn: string, args?: Record<string, unknown>) => {
        const { data, error } = await client.rpc(fn, args ?? {});
        return { data: (data as T) ?? null, error: error as Error | null };
      },
    } satisfies SupabaseClientLike;
    return cachedClient;
  }

  cachedClient = new MockSupabaseClient();
  return cachedClient;
}

export function getSupabaseStorageClient(): SupabaseClient | null {
  // If already initialized, return it
  if (supabaseJsClient) {
    return supabaseJsClient;
  }

  // Initialize independently for storage operations
  // This ensures storage operations work even if getSupabaseClient() hasn't been called
  const url = process.env.SUPABASE_URL;
  // Prefer SUPABASE_SERVICE_ROLE_KEY (SUPABASE_SECRET_KEY supported for backwards compatibility)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  const anonKey = process.env.SUPABASE_ANON_KEY;

  if (!url) {
    console.error('[Supabase Storage] SUPABASE_URL not configured');
    return null;
  }

  // Prefer service role key for storage (has full permissions)
  // Fallback to anon key (relies on RLS policies)
  const key = serviceKey || anonKey;

  if (!key) {
    console.error('[Supabase Storage] Neither SUPABASE_SERVICE_ROLE_KEY nor SUPABASE_ANON_KEY is configured');
    return null;
  }

  // Log which key we're using (but not the actual key value)
  if (serviceKey) {
    console.log('[Supabase Storage] Using SERVICE_ROLE_KEY (full permissions)');
  } else {
    console.warn('[Supabase Storage] Using ANON_KEY (relies on RLS policies - may have permission issues)');
  }

  // Create a new client for storage operations
  supabaseJsClient = createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return supabaseJsClient;
}
