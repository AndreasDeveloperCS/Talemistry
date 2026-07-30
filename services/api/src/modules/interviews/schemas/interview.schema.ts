import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type InterviewDocument = HydratedDocument<Interview>

export enum InterviewType {
  Screen = 'screen',
  Technical = 'technical',
  LiveCoding = 'live-coding',
  SystemDesign = 'system-design',
  Behavioral = 'behavioral',
  Panel = 'panel',
  Final = 'final',
}

export enum InterviewStatus {
  Scheduled = 'scheduled',
  Live = 'live',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

@Schema({ _id: false })
export class ScorecardCriterion {
  @Prop({ required: true }) competency: string
  @Prop({ required: true, min: 0, max: 4 }) rating: number
  @Prop({ default: 1 }) weight: number
  @Prop() note: string
}
const ScorecardCriterionSchema = SchemaFactory.createForClass(ScorecardCriterion)

@Schema({ timestamps: true, collection: 'interviews' })
export class Interview {
  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true, index: true })
  candidateId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Job', index: true })
  jobId: Types.ObjectId

  @Prop({ enum: InterviewType, required: true }) type: InterviewType
  @Prop({ enum: InterviewStatus, default: InterviewStatus.Scheduled, index: true })
  status: InterviewStatus

  @Prop({ required: true }) scheduledAt: Date
  @Prop({ default: 45 }) durationMinutes: number
  @Prop({ type: [String], default: [] }) interviewers: string[]

  // Ephemeral WebRTC room the interview room front-end joins.
  @Prop() roomId: string

  @Prop({ type: [ScorecardCriterionSchema], default: [] })
  scorecard: ScorecardCriterion[]
  @Prop() recommendation: string
  @Prop() notes: string
}

export const InterviewSchema = SchemaFactory.createForClass(Interview)
