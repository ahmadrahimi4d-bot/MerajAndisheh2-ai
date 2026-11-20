import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const databaseUrl = process.env.DATABASE_URL;

const globalForDb = globalThis as typeof globalThis & {
  __arenaNextJsPostgresqlPool?: Pool;
  __merajMemoryStore?: {
    tables: Map<string, Record<string, unknown>[]>;
    counters: Map<string, number>;
  };
};

type TableLike = {
  [key: symbol]: unknown;
};

type ColumnLike = {
  name: string;
  keyAsName?: boolean;
  hasDefault?: boolean;
  default?: unknown;
  columnType?: string;
  table?: TableLike;
};

type QueryChunk = {
  value?: unknown;
  name?: string;
  queryChunks?: QueryChunk[];
  encoder?: ColumnLike;
};

type SqlLike = {
  queryChunks?: QueryChunk[];
};

const SCHEMA_TABLES = [
  schema.settings,
  schema.categories,
  schema.contents,
  schema.users,
  schema.sessions,
  schema.visits,
  schema.downloads,
  schema.interactions,
  schema.plugins,
  schema.languages,
  schema.backupLogs,
  schema.mediaFiles,
];

function getTableName(table: unknown): string {
  const rec = table as TableLike;
  return String(rec[Symbol.for("drizzle:Name")] ?? "unknown");
}

function getTableColumns(table: unknown): Record<string, ColumnLike> {
  const rec = table as TableLike;
  return (rec[Symbol.for("drizzle:Columns")] as Record<string, ColumnLike>) ?? {};
}

function getColToPropMap(table: unknown): Map<string, string> {
  const cols = getTableColumns(table);
  const map = new Map<string, string>();
  for (const [prop, col] of Object.entries(cols)) {
    map.set(col.name, prop);
  }
  return map;
}

const tableNameToPropMap = new Map<string, Map<string, string>>();
const tableNameToCols = new Map<string, Record<string, ColumnLike>>();
for (const t of SCHEMA_TABLES) {
  const name = getTableName(t);
  tableNameToPropMap.set(name, getColToPropMap(t));
  tableNameToCols.set(name, getTableColumns(t));
}

function matchesCondition(row: Record<string, unknown>, cond: SqlLike | undefined, tableName: string): boolean {
  if (!cond || !Array.isArray(cond.queryChunks)) return true;
  const propMap = tableNameToPropMap.get(tableName) ?? new Map<string, string>();

  const evalNode = (chunks: QueryChunk[]): boolean => {
    const nested = chunks.filter((c) => Array.isArray(c?.queryChunks));
    if (nested.length > 0) {
      const hasOr = chunks.some((c) => Array.isArray(c?.value) && c.value.some((s) => String(s).toLowerCase().includes(" or ")));
      return hasOr
        ? nested.some((n) => evalNode(n.queryChunks!))
        : nested.every((n) => evalNode(n.queryChunks!));
    }
    const colChunk = chunks.find((c) => typeof c?.name === "string" && !Array.isArray(c?.value));
    const paramChunk = chunks.find((c) => c && "value" in c && !Array.isArray(c.value) && typeof c.name !== "string");
    if (colChunk && paramChunk) {
      const prop = propMap.get(colChunk.name!) ?? colChunk.name!;
      return row[prop] === paramChunk.value;
    }
    return true;
  };

  return evalNode(cond.queryChunks);
}

function parseOrderBy(orderExpr: SqlLike | undefined, tableName: string): { prop: string; desc: boolean } | null {
  if (!orderExpr || !Array.isArray(orderExpr.queryChunks)) return null;
  const propMap = tableNameToPropMap.get(tableName) ?? new Map<string, string>();
  const colChunk = orderExpr.queryChunks.find((c) => typeof c?.name === "string");
  if (!colChunk?.name) return null;
  const isDesc = orderExpr.queryChunks.some(
    (c) => Array.isArray(c?.value) && c.value.some((s) => String(s).toLowerCase().includes("desc")),
  );
  return { prop: propMap.get(colChunk.name) ?? colChunk.name, desc: isDesc };
}

function createMemoryDb() {
  if (!globalForDb.__merajMemoryStore) {
    globalForDb.__merajMemoryStore = {
      tables: new Map(),
      counters: new Map(),
    };
  }
  const store = globalForDb.__merajMemoryStore;

  const getRows = (tableName: string): Record<string, unknown>[] => {
    let rows = store.tables.get(tableName);
    if (!rows) {
      rows = [];
      store.tables.set(tableName, rows);
    }
    return rows;
  };

  const nextId = (tableName: string): number => {
    const next = (store.counters.get(tableName) ?? 0) + 1;
    store.counters.set(tableName, next);
    return next;
  };

  const bumpId = (tableName: string, id: unknown) => {
    if (typeof id === "number" && Number.isFinite(id)) {
      const cur = store.counters.get(tableName) ?? 0;
      if (id > cur) store.counters.set(tableName, id);
    }
  };

  const normalizeRow = (tableName: string, input: Record<string, unknown>): Record<string, unknown> => {
    const cols = tableNameToCols.get(tableName) ?? {};
    const out: Record<string, unknown> = { ...input };
    for (const [prop, col] of Object.entries(cols)) {
      if (out[prop] === undefined) {
        if (col.columnType === "PgSerial") {
          out[prop] = nextId(tableName);
        } else if (col.columnType === "PgTimestamp" && col.hasDefault) {
          out[prop] = new Date();
        } else if (col.default !== undefined) {
          out[prop] = Array.isArray(col.default)
            ? [...col.default]
            : col.default && typeof col.default === "object"
              ? { ...(col.default as Record<string, unknown>) }
              : col.default;
        } else {
          out[prop] = null;
        }
      } else if (col.columnType === "PgSerial") {
        bumpId(tableName, out[prop]);
      }
    }
    return out;
  };

  const makeSelectBuilder = () => {
    let tableName = "";
    let whereCond: SqlLike | undefined;
    let orderExpr: SqlLike | undefined;
    let limitCount: number | undefined;

    const run = async () => {
      let rows = [...getRows(tableName)];
      if (whereCond) rows = rows.filter((r) => matchesCondition(r, whereCond, tableName));
      if (orderExpr) {
        const parsed = parseOrderBy(orderExpr, tableName);
        if (parsed) {
          rows.sort((a, b) => {
            const av = a[parsed.prop];
            const bv = b[parsed.prop];
            const an = av instanceof Date ? av.getTime() : typeof av === "number" ? av : String(av ?? "");
            const bn = bv instanceof Date ? bv.getTime() : typeof bv === "number" ? bv : String(bv ?? "");
            if (an < bn) return parsed.desc ? 1 : -1;
            if (an > bn) return parsed.desc ? -1 : 1;
            return 0;
          });
        }
      }
      if (typeof limitCount === "number") rows = rows.slice(0, limitCount);
      return rows.map((r) => ({ ...r }));
    };

    const builder = {
      from(table: unknown) {
        tableName = getTableName(table);
        return builder;
      },
      where(cond: SqlLike) {
        whereCond = cond;
        return builder;
      },
      orderBy(expr: SqlLike) {
        orderExpr = expr;
        return builder;
      },
      limit(n: number) {
        limitCount = n;
        return builder;
      },
      then<TResult1 = Record<string, unknown>[], TResult2 = never>(
        onfulfilled?: ((value: Record<string, unknown>[]) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return run().then(onfulfilled, onrejected);
      },
    };
    return builder;
  };

  const makeInsertBuilder = (table: unknown) => {
    const tableName = getTableName(table);
    const propMap = tableNameToPropMap.get(tableName) ?? new Map<string, string>();
    let inputRows: Record<string, unknown>[] = [];
    let conflictTarget: string | null = null;
    let conflictSet: Record<string, unknown> | null = null;
    let shouldReturn = false;

    const run = async () => {
      const rows = getRows(tableName);
      const inserted: Record<string, unknown>[] = [];
      for (const raw of inputRows) {
        const normalized = normalizeRow(tableName, raw);
        if (conflictTarget && conflictSet) {
          const existingIdx = rows.findIndex((r) => r[conflictTarget!] === normalized[conflictTarget!]);
          if (existingIdx >= 0) {
            rows[existingIdx] = { ...rows[existingIdx], ...conflictSet };
            inserted.push({ ...rows[existingIdx] });
            continue;
          }
        }
        rows.push(normalized);
        inserted.push({ ...normalized });
      }
      return shouldReturn ? inserted : [];
    };

    const builder = {
      values(val: Record<string, unknown> | Record<string, unknown>[]) {
        inputRows = Array.isArray(val) ? val : [val];
        return builder;
      },
      returning() {
        shouldReturn = true;
        return builder;
      },
      onConflictDoUpdate(opts: { target: ColumnLike; set: Record<string, unknown> }) {
        conflictTarget = propMap.get(opts.target.name) ?? opts.target.name;
        conflictSet = opts.set;
        return builder;
      },
      then<TResult1 = Record<string, unknown>[], TResult2 = never>(
        onfulfilled?: ((value: Record<string, unknown>[]) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return run().then(onfulfilled, onrejected);
      },
    };
    return builder;
  };

  const makeUpdateBuilder = (table: unknown) => {
    const tableName = getTableName(table);
    let patch: Record<string, unknown> = {};
    let whereCond: SqlLike | undefined;

    const run = async () => {
      const rows = getRows(tableName);
      for (let i = 0; i < rows.length; i++) {
        if (matchesCondition(rows[i], whereCond, tableName)) {
          rows[i] = { ...rows[i], ...patch };
        }
      }
      return [];
    };

    const builder = {
      set(val: Record<string, unknown>) {
        patch = val;
        return builder;
      },
      where(cond: SqlLike) {
        whereCond = cond;
        return builder;
      },
      then<TResult1 = unknown[], TResult2 = never>(
        onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return run().then(onfulfilled, onrejected);
      },
    };
    return builder;
  };

  const makeDeleteBuilder = (table: unknown) => {
    const tableName = getTableName(table);
    let whereCond: SqlLike | undefined;

    const run = async () => {
      if (!whereCond) {
        store.tables.set(tableName, []);
        return [];
      }
      const rows = getRows(tableName);
      store.tables.set(
        tableName,
        rows.filter((r) => !matchesCondition(r, whereCond, tableName)),
      );
      return [];
    };

    const builder = {
      where(cond: SqlLike) {
        whereCond = cond;
        return builder;
      },
      then<TResult1 = unknown[], TResult2 = never>(
        onfulfilled?: ((value: unknown[]) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
      ) {
        return run().then(onfulfilled, onrejected);
      },
    };
    return builder;
  };

  return {
    select: () => makeSelectBuilder(),
    insert: (table: unknown) => makeInsertBuilder(table),
    update: (table: unknown) => makeUpdateBuilder(table),
    delete: (table: unknown) => makeDeleteBuilder(table),
    execute: async (query: SqlLike) => {
      const chunks = query?.queryChunks ?? [];
      const text = chunks
        .filter((c) => Array.isArray(c?.value))
        .flatMap((c) => c.value as string[])
        .join(" ")
        .toLowerCase();
      if (text.includes("insert into settings")) {
        const params = chunks.filter((c) => !Array.isArray(c?.value));
        const key = String(params[0] ?? "");
        const rawJson = String(params[1] ?? "{}");
        let parsed: unknown = {};
        try {
          parsed = JSON.parse(rawJson);
        } catch {
          parsed = {};
        }
        const rows = getRows("settings");
        const idx = rows.findIndex((r) => r.key === key);
        if (idx >= 0) {
          if (text.includes("do update")) {
            rows[idx] = { key, value: parsed, updatedAt: new Date() };
          }
        } else {
          rows.push({ key, value: parsed, updatedAt: new Date() });
        }
      }
      return { rows: [{ ok: 1 }] };
    },
  };
}

let pool: Pool | null = null;
type RealDb = ReturnType<typeof drizzle<typeof schema>>;
let dbInstance: RealDb;

if (databaseUrl) {
  pool =
    globalForDb.__arenaNextJsPostgresqlPool ??
    new Pool({
      connectionString: databaseUrl,
    });

  if (process.env.NODE_ENV !== "production") {
    globalForDb.__arenaNextJsPostgresqlPool = pool;
  }

  dbInstance = drizzle(pool, { schema });
} else {
  console.warn("[AI Studio] DATABASE_URL not set — using in-memory database store");
  dbInstance = createMemoryDb() as unknown as RealDb;
}

export { pool };
export const db = dbInstance;
