import { Module } from '@nestjs/common'
import { CandidatesModule } from '../candidates/candidates.module'
import { JobsModule } from '../jobs/jobs.module'
import { OffersModule } from '../offers/offers.module'
import { MongooseModule } from '@nestjs/mongoose'
import { Offer, OfferSchema } from '../offers/schemas/offer.schema'
import { AnalyticsController } from './analytics.controller'
import { AnalyticsService } from './analytics.service'

@Module({
  imports: [
    CandidatesModule,
    JobsModule,
    OffersModule,
    MongooseModule.forFeature([{ name: Offer.name, schema: OfferSchema }]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
