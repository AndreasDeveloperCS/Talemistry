import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument } from 'mongoose'

export type AssessmentDocument = HydratedDocument<Assessment>

export enum AssessmentKind {
  Skills = 'skills',
  Psychometric = 'psychometric',
  Culture = 'culture',
  Cognitive = 'cognitive',
}

@Schema({ timestamps: true, collection: 'assessments' })
export class Assessment {
  @Prop({ required: true }) name: string
  @Prop({ enum: AssessmentKind, required: true, index: true }) kind: AssessmentKind
  @Prop() duration: string
  @Prop() description: string
  @Prop({ default: false }) proctored: boolean
  @Prop({ default: true }) autoScored: boolean
  @Prop({ default: 0 }) assigned: number
  @Prop({ default: 0 }) completed: number
  @Prop({ default: 0, min: 0, max: 100 }) avgScore: number
}

export const AssessmentSchema = SchemaFactory.createForClass(Assessment)
