import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { FilterQuery, Model } from 'mongoose'
import { Job, JobDocument } from './schemas/job.schema'
import { CreateJobDto, QueryJobDto, UpdateJobDto } from './dto/job.dto'

@Injectable()
export class JobsService {
  constructor(@InjectModel(Job.name) private readonly model: Model<JobDocument>) {}

  create(dto: CreateJobDto) {
    return this.model.create({ ...dto, slug: dto.slug ?? this.slugify(dto.title) })
  }

  findAll(query: QueryJobDto) {
    const filter: FilterQuery<JobDocument> = {}
    if (query.q) filter.$text = { $search: query.q }
    if (query.status) filter.status = query.status
    return this.model.find(filter).sort({ updatedAt: -1 }).lean()
  }

  async findOne(id: string) {
    const doc = await this.model.findById(id).lean()
    if (!doc) throw new NotFoundException(`Job ${id} not found`)
    return doc
  }

  async findBySlug(slug: string) {
    const doc = await this.model.findOne({ slug }).lean()
    if (!doc) throw new NotFoundException(`Job "${slug}" not found`)
    return doc
  }

  async update(id: string, dto: UpdateJobDto) {
    const doc = await this.model.findByIdAndUpdate(id, dto, { new: true }).lean()
    if (!doc) throw new NotFoundException(`Job ${id} not found`)
    return doc
  }

  async remove(id: string) {
    const res = await this.model.findByIdAndDelete(id)
    if (!res) throw new NotFoundException(`Job ${id} not found`)
    return { deleted: true, id }
  }

  private slugify(input: string) {
    return input
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }
}
