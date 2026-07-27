import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type JobDocument = HydratedDocument<Job>

export enum JobStatus {
  Draft = 'draft',
  Published = 'published',
  Paused = 'paused',
  Closed = 'closed',
}

export enum WorkModel {
  Remote = 'remote',
  Hybrid = 'hybrid',
  Onsite = 'onsite',
}

@Schema({ timestamps: true, collection: 'jobs' })
export class Job {
  @Prop({ required: true, trim: true }) title: string
  @Prop({ required: true, trim: true }) department: string
  @Prop({ trim: true }) location: string
  @Prop({ enum: WorkModel, default: WorkModel.Hybrid }) workModel: WorkModel
  @Prop({ enum: JobStatus, default: JobStatus.Draft, index: true }) status: JobStatus

  @Prop() seniority: string
  @Prop() summary: string
  @Prop({ type: [String], default: [] }) mustHaveSkills: string[]
  @Prop({ type: [String], default: [] }) niceToHaveSkills: string[]

  @Prop({ default: 0 }) salaryMin: number
  @Prop({ default: 0 }) salaryMax: number
  @Prop({ default: 'EUR' }) currency: string

  @Prop({ default: 0 }) applicants: number
  @Prop({ default: 0 }) inPipeline: number
  @Prop({ min: 0, max: 100, default: 0 }) healthScore: number

  @Prop() hiringManager: string
  @Prop() recruiter: string

  // SEO / GEO — programmatic careers pages
  @Prop({ unique: true, sparse: true }) slug: string
  @Prop() metaDescription: string
}

export const JobSchema = SchemaFactory.createForClass(Job)
JobSchema.index({ title: 'text', summary: 'text', department: 'text' })
