import { Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { Model } from 'mongoose'
import { Candidate, CandidateDocument } from '../candidates/schemas/candidate.schema'
import { Job, JobDocument, JobStatus } from '../jobs/schemas/job.schema'
import { Offer, OfferDocument, OfferStatus } from '../offers/schemas/offer.schema'
import { JOURNEY_META, JOURNEY_ORDER } from '../../common/journey'

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Candidate.name) private readonly candidates: Model<CandidateDocument>,
    @InjectModel(Job.name) private readonly jobs: Model<JobDocument>,
    @InjectModel(Offer.name) private readonly offers: Model<OfferDocument>,
  ) {}

  async overview() {
    const [totalCandidates, openRoles, offersSent, accepted, avgMatchAgg, funnelAgg] =
      await Promise.all([
        this.candidates.countDocuments(),
        this.jobs.countDocuments({ status: JobStatus.Published }),
        this.offers.countDocuments({ status: { $in: [OfferStatus.Sent, OfferStatus.Accepted] } }),
        this.offers.countDocuments({ status: OfferStatus.Accepted }),
        this.candidates.aggregate([
          { $group: { _id: null, avg: { $avg: '$matchScore' } } },
        ]),
        this.candidates.aggregate([{ $group: { _id: '$stage', count: { $sum: 1 } } }]),
      ])

    const funnelMap = new Map<string, number>(
      funnelAgg.map((f: { _id: string; count: number }) => [f._id, f.count]),
    )
    const funnel = JOURNEY_ORDER.map((stage) => ({
      stage,
      label: JOURNEY_META[stage].label,
      count: funnelMap.get(stage) ?? 0,
    }))

    return {
      kpis: {
        totalCandidates,
        openRoles,
        offersSent,
        offerAcceptanceRate: offersSent ? Math.round((accepted / offersSent) * 100) : 0,
        avgChemistryMatch: Math.round(avgMatchAgg[0]?.avg ?? 0),
      },
      funnel,
    }
  }

  /** Source-of-hire distribution for the acquisition dashboard. */
  async sources() {
    return this.candidates.aggregate([
      { $unwind: { path: '$tags', preserveNullAndEmptyArrays: false } },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 8 },
      { $project: { _id: 0, source: '$_id', count: 1 } },
    ])
  }
}
