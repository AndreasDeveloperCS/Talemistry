import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { randomUUID } from 'crypto'
import { Interview, InterviewDocument, InterviewStatus } from './schemas/interview.schema'

@Injectable()
export class InterviewsService {
  constructor(
    @InjectModel(Interview.name) private readonly model: Model<InterviewDocument>,
  ) {}

  create(dto: Partial<Interview>) {
    return this.model.create({ ...dto, roomId: dto.roomId ?? `room-${randomUUID()}` })
  }

  findAll(status?: InterviewStatus) {
    const filter = status ? { status } : {}
    return this.model.find(filter).sort({ scheduledAt: 1 }).populate('candidateId').lean()
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).populate('candidateId').lean()
    if (!doc) throw new NotFoundException(`Interview ${id} not found`)
    return doc
  }

  async update(id: string, dto: Partial<Interview>) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean()
    if (!doc) throw new NotFoundException(`Interview ${id} not found`)
    return doc
  }

  submitScorecard(id: string, scorecard: Interview['scorecard'], recommendation: string) {
    return this.update(id, { scorecard, recommendation, status: InterviewStatus.Completed })
  }
}
