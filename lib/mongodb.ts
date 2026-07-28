import mongoose from "mongoose"

/**
 * Talemistry MongoDB connections.
 *
 * We maintain two cached connections:
 *   - PRIMARY  (`TALEMISTRY_MONGODB_URI`) — the native Talemistry database with
 *     full read/write access. This is the app's source of truth.
 *   - SOURCE   (`MONGODB_URI`, the legacy `evryka` cluster) — used READ-ONLY,
 *     only by the migration script. Never written to.
 *
 * Connections are cached on the Node global so hot-reloads in dev and warm
 * serverless invocations reuse a single pooled connection.
 */

/**
 * Some environments truncate the leading characters of the connection string
 * when it is stored/entered. Repair the well-known `mongodb(+srv)://` scheme so
 * a partial prefix like `odb+srv://` or `b+srv://` still connects.
 */
export function normalizeMongoUri(raw: string | undefined): string {
  if (!raw) return ""
  let uri = raw.trim().replace(/^['"]|['"]$/g, "")
  if (/^mongodb(\+srv)?:\/\//.test(uri)) return uri
  // Repair a truncated scheme: find the "...b+srv://" or "...b://" tail.
  const srvIdx = uri.indexOf("+srv://")
  if (srvIdx !== -1) return "mongodb" + uri.slice(srvIdx)
  const stdIdx = uri.indexOf("://")
  if (stdIdx !== -1 && stdIdx <= 8) return "mongodb" + uri.slice(stdIdx)
  return uri
}

// Native Talemistry DB (read/write). Prefer MONGODB_CONNECTION_STRING; fall
// back to the earlier TALEMISTRY_MONGODB_URI for backwards compatibility.
const PRIMARY_URI = normalizeMongoUri(
  process.env.MONGODB_CONNECTION_STRING || process.env.TALEMISTRY_MONGODB_URI,
)
const SOURCE_URI = normalizeMongoUri(process.env.MONGODB_URI)
const PRIMARY_DB_NAME = process.env.TALEMISTRY_DB_NAME || "talemistry"

interface ConnCache {
  primary: mongoose.Connection | null
  source: mongoose.Connection | null
}

declare global {
  // eslint-disable-next-line no-var
  var _talemistryConns: ConnCache | undefined
}

const cache: ConnCache = global._talemistryConns ?? { primary: null, source: null }
global._talemistryConns = cache

/** Primary Talemistry connection (read/write). */
export async function getConnection(): Promise<mongoose.Connection> {
  if (!PRIMARY_URI) {
    throw new Error("MONGODB_CONNECTION_STRING is not set")
  }
  if (cache.primary && cache.primary.readyState === 1) return cache.primary

  const conn = await mongoose
    .createConnection(PRIMARY_URI, {
      dbName: PRIMARY_DB_NAME,
      serverSelectionTimeoutMS: 12000,
      connectTimeoutMS: 12000,
      maxPoolSize: 10,
    })
    .asPromise()

  cache.primary = conn
  return conn
}

/** Primary Talemistry database handle (read/write). */
export async function getDb() {
  const conn = await getConnection()
  return conn.db!
}

/** Convenience helper for a named collection on the primary (talemistry) DB. */
export async function collection(name: string) {
  const db = await getDb()
  return db.collection(name)
}

/** Legacy `evryka` SOURCE connection — READ ONLY, migration use only. */
export async function getSourceDb() {
  if (!SOURCE_URI) {
    throw new Error("MONGODB_URI (source/evryka) is not set")
  }
  if (cache.source && cache.source.readyState === 1) return cache.source.db!

  const conn = await mongoose
    .createConnection(SOURCE_URI, {
      serverSelectionTimeoutMS: 12000,
      connectTimeoutMS: 12000,
      maxPoolSize: 5,
    })
    .asPromise()

  cache.source = conn
  return conn.db!
}

export async function sourceCollection(name: string) {
  const db = await getSourceDb()
  return db.collection(name)
}
