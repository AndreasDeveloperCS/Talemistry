import mongoose from "mongoose"

/**
 * Serverless-safe MongoDB (Mongoose) connection.
 *
 * The connection is cached on the Node global so that hot-reloads in dev and
 * warm serverless invocations in production reuse a single pooled connection
 * instead of opening a new one on every request.
 *
 * This project uses the connection in a READ-ONLY manner against the existing
 * `evryka` database — we never create, mutate, or drop documents.
 */

const MONGODB_URI = process.env.MONGODB_URI

interface MongooseCache {
  conn: typeof mongoose | null
  promise: Promise<typeof mongoose> | null
}

declare global {
  // eslint-disable-next-line no-var
  var _talemistryMongoose: MongooseCache | undefined
}

const cache: MongooseCache = global._talemistryMongoose ?? { conn: null, promise: null }
global._talemistryMongoose = cache

export async function getDb() {
  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI is not set")
  }

  if (cache.conn) return cache.conn.connection.db

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 12000,
      // We only read; keep the pool small.
      maxPoolSize: 5,
      // Fail fast in serverless rather than hanging a request.
      connectTimeoutMS: 12000,
    })
  }

  cache.conn = await cache.promise
  return cache.conn.connection.db
}

/** Convenience helper for a named collection from the shared connection. */
export async function collection(name: string) {
  const db = await getDb()
  return db.collection(name)
}
