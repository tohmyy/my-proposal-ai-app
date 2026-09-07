import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

const globalForDb = globalThis as unknown as {
  __koyaSql?: ReturnType<typeof postgres>;
  __koyaDb?: Db;
};

function getSql() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env.local and add your Supabase Postgres URI.",
    );
  }

  if (!globalForDb.__koyaSql) {
    globalForDb.__koyaSql = postgres(connectionString, {
      prepare: false,
      max: 10,
    });
  }

  return globalForDb.__koyaSql;
}

export function getDb() {
  if (!globalForDb.__koyaDb) {
    globalForDb.__koyaDb = drizzle(getSql(), { schema });
  }
  return globalForDb.__koyaDb;
}

/** Convenience proxy so existing `db.select()` call sites keep working. */
export const db = new Proxy({} as Db, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getDb(), prop, receiver);
    return typeof value === "function" ? value.bind(getDb()) : value;
  },
});
