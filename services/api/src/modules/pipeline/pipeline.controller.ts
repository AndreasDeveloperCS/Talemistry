import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { IsEnum } from 'class-validator'
import { PipelineService } from './pipeline.service'
import { PipelineGateway } from '../../realtime/pipeline.gateway'
import { JourneyStage } from '../../common/journey'

class MoveDto {
  @IsEnum(JourneyStage) stage: JourneyStage
}

@ApiTags('pipeline')
@Controller('pipeline')
export class PipelineController {
  constructor(
    private readonly service: PipelineService,
    private readonly gateway: PipelineGateway,
  ) {}

  @Get('board')
  board(@Query('jobId') jobId?: string) {
    return this.service.board(jobId)
  }

  @Get('funnel')
  funnel(@Query('jobId') jobId?: string) {
    return this.service.funnel(jobId)
  }

  @Patch('candidates/:id/move')
  async move(@Param('id') id: string, @Body() dto: MoveDto) {
    const updated = await this.service.move(id, dto.stage)
    // Broadcast the stage change to every connected recruiter board in real time.
    this.gateway.broadcastMove({ candidateId: id, stage: dto.stage })
    return updated
  }
}
