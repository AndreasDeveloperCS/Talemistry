import { Module } from '@nestjs/common'
import { PipelineGateway } from './pipeline.gateway'
import { CollaborationGateway } from './collaboration.gateway'
import { SignalingGateway } from './signaling.gateway'

@Module({
  providers: [PipelineGateway, CollaborationGateway, SignalingGateway],
  exports: [PipelineGateway, CollaborationGateway, SignalingGateway],
})
export class RealtimeModule {}
