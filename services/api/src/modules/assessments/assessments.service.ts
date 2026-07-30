import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Assessment, AssessmentDocument, AssessmentKind } from './schemas/assessment.schema'

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectModel(Assessment.name) private readonly model: Model<AssessmentDocument>,
  ) {}

  create(dto: Partial<Assessment>) {
    return this.model.create(dto)
  }

  findAll(kind?: AssessmentKind) {
    const filter = kind ? { kind } : {}
    return this.model.find(filter).sort({ createdAt: -1 }).lean()
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean()
    if (!doc) throw new NotFoundException(`Assessment ${id} not found`)
    return doc
  }
}
