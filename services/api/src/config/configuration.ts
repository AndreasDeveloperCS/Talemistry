export interface AppConfig {
  env: string
  port: number
  mongoUri: string
  dbName: string
  corsOrigins: string[]
  jwtSecret: string
  jwtExpiresIn: string
}

/**
 * Repair a truncated `mongodb(+srv)://` scheme so a partial prefix like
 * `odb+srv://` still connects (some environments trim the leading chars when
 * the connection string is stored).
 */
function normalizeMongoUri(raw: string | undefined): string {
  if (!raw) return ''
  const uri = raw.trim().replace(/^['"]|['"]$/g, '')
  if (/^mongodb(\+srv)?:\/\//.test(uri)) return uri
  const srvIdx = uri.indexOf('+srv://')
  if (srvIdx !== -1) return 'mongodb' + uri.slice(srvIdx)
  const stdIdx = uri.indexOf('://')
  if (stdIdx !== -1 && stdIdx <= 8) return 'mongodb' + uri.slice(stdIdx)
  return uri
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  // Prefer the native write-enabled Talemistry DB; fall back to the legacy
  // source URI, then local.
  mongoUri: normalizeMongoUri(
    process.env.MONGODB_CONNECTION_STRING ??
      process.env.TALEMISTRY_MONGODB_URI ??
      process.env.MONGODB_URI ??
      'mongodb://127.0.0.1:27017/talemistry',
  ),
  dbName: process.env.TALEMISTRY_DB_NAME ?? 'talemistry',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
})
