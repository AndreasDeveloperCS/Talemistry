import { collection } from "./mongodb"
import type { Candidate, Job, Interview, Offer, Assessment } from "./data"
import type { PipelineStatus } from "./journey"

/** Remove Mongo's _id so documents match the frontend interfaces exactly. */
function clean<T>(doc: Record<string, unknown> | null): T | null {
  if (!doc) return null
  const { _id, ...rest } = doc
  return rest as T
}
function cleanMany<T>(docs: Record<string, unknown>[]): T[] {
  return docs.map((d) => {
    const { _id, ...rest } = d
    return rest as T
  })
}

/* ----------------------------- Candidates ----------------------------- */

export async function getCandidates(filter: Record<string, unknown> = {}): Promise<Candidate[]> {
  const col = await collection("candidates")
  const docs = await col.find(filter).sort({ matchScore: -1 }).toArray()
  return cleanMany<Candidate>(docs)
}

export async function getCandidateById(id: string): Promise<Candidate | null> {
  const col = await collection("candidates")
  return clean<Candidate>(await col.findOne({ id }))
}

export async function getCandidatesByJob(jobId: string): Promise<Candidate[]> {
  return getCandidates({ jobId })
}

export async function updateCandidateStatus(id: string, status: PipelineStatus): Promise<Candidate | null> {
  const col = await collection("candidates")
  await col.updateOne({ id }, { $set: { status, updatedAt: new Date().toISOString() } })
  return getCandidateById(id)
}

export async function createCandidate(input: Candidate): Promise<Candidate> {
  const col = await collection("candidates")
  await col.insertOne({ ...input } as Record<string, unknown>)
  return input
}

/* -------------------------------- Jobs -------------------------------- */

export async function getJobs(filter: Record<string, unknown> = {}): Promise<Job[]> {
  const col = await collection("jobs")
  const docs = await col.find(filter).toArray()
  return cleanMany<Job>(docs)
}

export async function getJobById(id: string): Promise<Job | null> {
  const col = await collection("jobs")
  return clean<Job>(await col.findOne({ id }))
}

export async function createJob(input: Job): Promise<Job> {
  const col = await collection("jobs")
  await col.insertOne({ ...input } as Record<string, unknown>)
  return input
}

export async function updateJob(id: string, patch: Partial<Job>): Promise<Job | null> {
  const col = await collection("jobs")
  await col.updateOne({ id }, { $set: { ...patch, updatedAt: new Date().toISOString() } })
  return getJobById(id)
}

/* ------------------------------ Interviews ---------------------------- */

export async function getInterviews(filter: Record<string, unknown> = {}): Promise<Interview[]> {
  const col = await collection("interviews")
  const docs = await col.find(filter).sort({ start: 1 }).toArray()
  return cleanMany<Interview>(docs)
}

export async function createInterview(input: Interview): Promise<Interview> {
  const col = await collection("interviews")
  await col.insertOne({ ...input } as Record<string, unknown>)
  return input
}

export async function updateInterview(id: string, patch: Partial<Interview>): Promise<Interview | null> {
  const col = await collection("interviews")
  await col.updateOne({ id }, { $set: patch })
  return clean<Interview>(await col.findOne({ id }))
}

/* -------------------------------- Offers ------------------------------ */

export async function getOffers(filter: Record<string, unknown> = {}): Promise<Offer[]> {
  const col = await collection("offers")
  const docs = await col.find(filter).sort({ createdAt: -1 }).toArray()
  return cleanMany<Offer>(docs)
}

export async function createOffer(input: Offer): Promise<Offer> {
  const col = await collection("offers")
  await col.insertOne({ ...input } as Record<string, unknown>)
  return input
}

export async function updateOffer(id: string, patch: Partial<Offer>): Promise<Offer | null> {
  const col = await collection("offers")
  await col.updateOne({ id }, { $set: patch })
  return clean<Offer>(await col.findOne({ id }))
}

/* ----------------------------- Assessments ---------------------------- */

export async function getAssessments(): Promise<Assessment[]> {
  const col = await collection("assessments")
  const docs = await col.find({}).toArray()
  return cleanMany<Assessment>(docs)
}
