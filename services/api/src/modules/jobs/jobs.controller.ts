import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { JobsService } from './jobs.service'
import { CreateJobDto, QueryJobDto, UpdateJobDto } from './dto/job.dto'

@ApiTags('jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly service: JobsService) {}

  @Post()
  create(@Body() dto: CreateJobDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query() query: QueryJobDto) {
    return this.service.findAll(query)
  }

  @Get('slug/:slug')
  findBySlug(@Param('slug') slug: string) {
    return this.service.findBySlug(slug)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
