import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { InterviewsService } from './interviews.service'
import { Interview, InterviewStatus } from './schemas/interview.schema'

@ApiTags('interviews')
@Controller('interviews')
export class InterviewsController {
  constructor(private readonly service: InterviewsService) {}

  @Post()
  create(@Body() dto: Partial<Interview>) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query('status') status?: InterviewStatus) {
    return this.service.findAll(status)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<Interview>) {
    return this.service.update(id, dto)
  }

  @Patch(':id/scorecard')
  scorecard(
    @Param('id') id: string,
    @Body() body: { scorecard: Interview['scorecard']; recommendation: string },
  ) {
    return this.service.submitScorecard(id, body.scorecard, body.recommendation)
  }
}
