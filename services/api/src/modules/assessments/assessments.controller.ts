import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssessmentsService } from './assessments.service'
import { Assessment, AssessmentKind } from './schemas/assessment.schema'

@ApiTags('assessments')
@Controller('assessments')
export class AssessmentsController {
  constructor(private readonly service: AssessmentsService) {}

  @Post()
  create(@Body() dto: Partial<Assessment>) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query('kind') kind?: AssessmentKind) {
    return this.service.findAll(kind)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }
}
