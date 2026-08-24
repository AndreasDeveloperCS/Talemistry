import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'
import { JourneyStage, WorkStyleType } from '../../../common/journey'

export type CandidateDocument = HydratedDocument<Candidate>

@Schema({ _id: false })
export class TalentElement {
  @Prop({ required: true }) key: string
  @Prop({ required: true }) label: string
  @Prop({ required: true, min: 0, max: 100 }) score: number
}
const TalentElementSchema = SchemaFactory.createForClass(TalentElement)

@Schema({ _id: false })
export class VerifiedSkill {
  @Prop({ required: true }) name: string
  @Prop({ required: true, min: 0, max: 100 }) level: number
  @Prop({ default: false }) verified: boolean
  @Prop() source: string
}
const VerifiedSkillSchema = SchemaFactory.createForClass(VerifiedSkill)

@Schema({ _id: false })
export class WorkStyleAxis {
  @Prop({ required: true }) axis: string
  @Prop({ required: true, min: 0, max: 100 }) value: number
  @Prop({ required: true }) leftLabel: string
  @Prop({ required: true }) rightLabel: string
}
const WorkStyleAxisSchema = SchemaFactory.createForClass(WorkStyleAxis)

@Schema({ timestamps: true, collection: 'candidates' })
export class Candidate {
  @Prop({ required: true, trim: true }) name: string
  @Prop({ required: true, trim: true }) title: string
  @Prop({ trim: true }) location: string
  @Prop({ lowercase: true, trim: true }) email: string
  @Prop() phone: string
  @Prop({ default: 0 }) yearsExperience: number

  // Chemistry Match — Talemistry's signature signal (0–100)
  @Prop({ required: true, min: 0, max: 100, index: true }) matchScore: number

  // Candidate Formula — weighted talent elements
  @Prop({ type: [TalentElementSchema], default: [] }) elements: TalentElement[]

  @Prop({ type: [VerifiedSkillSchema], default: [] }) skills: VerifiedSkill[]

  // Team Chemistry / work-style spectrum (human-supervised type indicator)
  @Prop({ type: [WorkStyleAxisSchema], default: [] }) workStyle: WorkStyleAxis[]
  @Prop({ enum: WorkStyleType }) workStyleType: WorkStyleType

  @Prop({ enum: JourneyStage, default: JourneyStage.Understand, index: true })
  stage: JourneyStage

  @Prop({ type: [String], default: [] }) tags: string[]
  @Prop() summary: string
  @Prop() avatarTone: string
  @Prop({ min: 0, max: 100 }) potentialSpectrum: number

  @Prop({ type: [{ type: 'ObjectId', ref: 'Job' }], default: [] })
  appliedJobs: string[]

  // GDPR consent + data-processing audit anchor
  @Prop({ default: false }) consentGiven: boolean
  @Prop() consentAt: Date
}

export const CandidateSchema = SchemaFactory.createForClass(Candidate)
CandidateSchema.index({ name: 'text', title: 'text', summary: 'text' })
