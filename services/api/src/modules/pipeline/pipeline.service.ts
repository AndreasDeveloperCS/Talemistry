import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema'
import { CandidatesService } from '../candidates/candidates.service'
import { JOURNEY_ORDER, JOURNEY_META, JourneyStage } from '../../common/journey'

export interface PipelineColumn {
  stage: JourneyStage
  label: string
  promise: string
  count: number
  candidates: Candidate[]
}

@Injectable()
export class PipelineService {
  constructor(
    @InjectModel(Candidate.name) private readonly model: Model<CandidateDocument>,
    private readonly candidates: CandidatesService,
  ) {}

  /** Returns candidates grouped into the 7 journey columns (optionally for one job). */
  async board(jobId?: string): Promise<PipelineColumn[]> {
    const filter = jobId ? { appliedJobs: jobId } : {}
    const all = await this.model.find(filter).sort({ matchScore: -1 }).lean()
    return JOURNEY_ORDER.map((stage) => {
      const candidates = all.filter((c) => c.stage === stage)
      return {
        stage,
        label: JOURNEY_META[stage].label,
        promise: JOURNEY_META[stage].promise,
        count: candidates.length,
        candidates: candidates as Candidate[],
      }
    })
  }

  move(candidateId: string, stage: JourneyStage) {
    return this.candidates.moveToStage(candidateId, stage)
  }

  async funnel(jobId?: string) {
    const board = await this.board(jobId)
    return board.map((c) => ({ stage: c.stage, label: c.label, count: c.count }))
  }
}
