import { Module } from '@nestjs/common'
import { CandidatesModule } from '../candidates/candidates.module'
import { RealtimeModule } from '../../realtime/realtime.module'
import { PipelineController } from './pipeline.controller'
import { PipelineService } from './pipeline.service'

@Module({
  imports: [CandidatesModule, RealtimeModule],
  controllers: [PipelineController],
  providers: [PipelineService],
})
export class PipelineModule {}
