import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { HydratedDocument, Types } from 'mongoose'

export type OfferDocument = HydratedDocument<Offer>

export enum OfferStatus {
  Drafting = 'drafting',
  PendingApproval = 'pending-approval',
  Approved = 'approved',
  Sent = 'sent',
  Accepted = 'accepted',
  Declined = 'declined',
  Withdrawn = 'withdrawn',
}

@Schema({ _id: false })
export class ApprovalStep {
  @Prop({ required: true }) approver: string
  @Prop({ required: true }) role: string
  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  decision: string
  @Prop() decidedAt: Date
}
const ApprovalStepSchema = SchemaFactory.createForClass(ApprovalStep)

@Schema({ timestamps: true, collection: 'offers' })
export class Offer {
  @Prop({ type: Types.ObjectId, ref: 'Candidate', required: true, index: true })
  candidateId: Types.ObjectId
  @Prop({ type: Types.ObjectId, ref: 'Job', required: true }) jobId: Types.ObjectId

  @Prop({ enum: OfferStatus, default: OfferStatus.Drafting, index: true })
  status: OfferStatus

  @Prop({ required: true }) baseSalary: number
  @Prop({ default: 0 }) bonus: number
  @Prop({ default: 0 }) equity: number
  @Prop({ default: 'EUR' }) currency: string
  @Prop() startDate: Date

  @Prop({ type: [ApprovalStepSchema], default: [] }) approvals: ApprovalStep[]
  @Prop({ min: 0, max: 100, default: 50 }) acceptanceLikelihood: number
  @Prop() expiresAt: Date
}

export const OfferSchema = SchemaFactory.createForClass(Offer)
