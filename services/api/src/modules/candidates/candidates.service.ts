import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { Candidate, CandidateDocument } from './schemas/candidate.schema'
import {
  CreateCandidateDto,
  QueryCandidateDto,
  UpdateCandidateDto,
} from './dto/candidate.dto'
import { JourneyStage } from '../../common/journey'

@Injectable()
export class CandidatesService {
  constructor(
    @InjectModel(Candidate.name) private readonly model: Model<CandidateDocument>,
  ) {}

  async create(dto: CreateCandidateDto) {
    return this.model.create(dto)
  }

  async findAll(query: QueryCandidateDto) {
    const { q, stage, minMatch, page = 1, limit = 20 } = query
    const filter: FilterQuery<CandidateDocument> = {}
    if (q) filter.$text = { $search: q }
    if (stage) filter.stage = stage
    if (typeof minMatch === 'number') filter.matchScore = { $gte: minMatch }

    const [items, total] = await Promise.all([
      this.model
        .find(filter)
        .sort({ matchScore: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      this.model.countDocuments(filter),
    ])
    return { items, total, page, limit, pages: Math.ceil(total / limit) }
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean()
    if (!doc) throw new NotFoundException(`Candidate ${id} not found`)
    return doc
  }

  async update(id: string, dto: UpdateCandidateDto) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean()
    if (!doc) throw new NotFoundException(`Candidate ${id} not found`)
    return doc
  }

  /** Advance a candidate to a new journey stage (used by the pipeline board). */
  async moveToStage(id: string, stage: JourneyStage) {
    const doc = await this.model.findByIdAndUpdate(id, { stage }, { new: true }).lean()
    if (!doc) throw new NotFoundException(`Candidate ${id} not found`)
    return doc
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id)
    if (!res) throw new NotFoundException(`Candidate ${id} not found`)
    return { deleted: true, id }
  }
}
