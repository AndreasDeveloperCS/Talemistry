import { collection, sourceCollection } from "./mongodb"
import { hashPassword } from "./auth"
import {
  CANDIDATES,
  JOBS,
  INTERVIEWS,
  OFFERS,
  ASSESSMENTS,
} from "./data"

export interface MigrationReport {
  seeded: Record<string, number>
  migrated: Record<string, number>
  accounts: string[]
  warnings: string[]
}

/** Seed a talemistry collection from a static array (idempotent: replace all). */
async function seedCollection(name: string, docs: Record<string, unknown>[]) {
  const col = await collection(name)
  await col.deleteMany({})
  if (docs.length) await col.insertMany(docs.map((d) => ({ ...d })))
  return docs.length
}

/** Copy an entire evryka collection into talemistry, preserving _id. */
async function copyFromSource(name: string, warnings: string[]): Promise<number> {
  try {
    const src = await sourceCollection(name)
    const docs = await src.find({}).toArray()
    const dst = await collection(name)
    await dst.deleteMany({})
    if (docs.length) await dst.insertMany(docs, { ordered: false })
    return docs.length
  } catch (err) {
    warnings.push(`Could not migrate '${name}' from evryka: ${(err as Error).message}`)
    return 0
  }
}

export async function runMigration(): Promise<MigrationReport> {
  const warnings: string[] = []

  // 1) Seed the app's primary domain collections from the typed demo data.
  const seeded: Record<string, number> = {
    candidates: await seedCollection("candidates", CANDIDATES as unknown as Record<string, unknown>[]),
    jobs: await seedCollection("jobs", JOBS as unknown as Record<string, unknown>[]),
    interviews: await seedCollection("interviews", INTERVIEWS as unknown as Record<string, unknown>[]),
    offers: await seedCollection("offers", OFFERS as unknown as Record<string, unknown>[]),
    assessments: await seedCollection("assessments", ASSESSMENTS as unknown as Record<string, unknown>[]),
  }

  // 2) Migrate the real evryka collections that power live analytics.
  const migrated: Record<string, number> = {}
  for (const name of ["talent-pipeline-progress", "users", "talent-profile", "skills"]) {
    migrated[name] = await copyFromSource(name, warnings)
  }

  // 3) Ensure indexes for fast lookups / uniqueness.
  try {
    const accounts = await collection("accounts")
    await accounts.createIndex({ email: 1 }, { unique: true })
    const candidates = await collection("candidates")
    await candidates.createIndex({ id: 1 }, { unique: true })
    await candidates.createIndex({ jobId: 1 })
    await candidates.createIndex({ status: 1 })
    const jobs = await collection("jobs")
    await jobs.createIndex({ id: 1 }, { unique: true })
  } catch (err) {
    warnings.push(`Index creation warning: ${(err as Error).message}`)
  }

  // 4) Seed demo login accounts (idempotent upsert by email).
  const accounts = await collection("accounts")
  const demoAccounts = [
    { email: "admin@talemistry.com", name: "Isabella Moreau", role: "admin", password: "Talemistry!2026" },
    { email: "director@talemistry.com", name: "Isabella Moreau", role: "hr_director", password: "Talemistry!2026" },
    { email: "recruiter@talemistry.com", name: "Marcus Lindqvist", role: "recruiter", password: "Talemistry!2026" },
  ]
  const created: string[] = []
  for (const a of demoAccounts) {
    const email = a.email.toLowerCase()
    const existing = await accounts.findOne({ email })
    if (existing) continue
    await accounts.insertOne({
      id: `acc-seed-${a.role}`,
      email,
      name: a.name,
      role: a.role,
      passwordHash: await hashPassword(a.password),
      createdAt: new Date().toISOString(),
    })
    created.push(email)
  }

  return { seeded, migrated, accounts: created, warnings }
}
