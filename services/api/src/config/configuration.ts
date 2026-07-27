export interface AppConfig {
  env: string
  port: number
  mongoUri: string
  corsOrigins: string[]
  jwtSecret: string
  jwtExpiresIn: string
}

export default (): AppConfig => ({
  env: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '4000', 10),
  mongoUri: process.env.MONGODB_URI ?? 'mongodb://127.0.0.1:27017/talemistry',
  corsOrigins: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:4200')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET ?? 'change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
})
