import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Offer, OfferDocument, OfferStatus } from './schemas/offer.schema'

@Injectable()
export class OffersService {
  constructor(@InjectModel(Offer.name) private readonly model: Model<OfferDocument>) {}

  create(dto: Partial<Offer>) {
    return this.model.create(dto)
  }

  findAll(status?: OfferStatus) {
    const filter = status ? { status } : {}
    return this.model.find(filter).sort({ updatedAt: -1 }).populate('candidateId jobId').lean()
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('candidateId jobId').lean()
    if (!doc) throw new NotFoundException(`Offer ${id} not found`)
    return doc
  }

  async transition(id: string, status: OfferStatus) {
    const doc = await this.model.findByIdAndUpdate(id, { status }, { new: true }).lean()
    if (!doc) throw new NotFoundException(`Offer ${id} not found`)
    return doc
  }

  async approve(id: string, approver: string) {
    const offer = await this.model.findById(id)
    if (!offer) throw new NotFoundException(`Offer ${id} not found`)
    const step = offer.approvals.find((a) => a.approver === approver)
    if (step) {
      step.decision = 'approved'
      step.decidedAt = new Date()
    }
    if (offer.approvals.every((a) => a.decision === 'approved')) {
      offer.status = OfferStatus.Approved
    }
    await offer.save()
    return offer.toObject()
  }
}
