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
import { CandidatesService } from './candidates.service'
import {
  CreateCandidateDto,
  QueryCandidateDto,
  UpdateCandidateDto,
} from './dto/candidate.dto'

@ApiTags('candidates')
@Controller('candidates')
export class CandidatesController {
  constructor(private readonly service: CandidatesService) {}

  @Post()
  create(@Body() dto: CreateCandidateDto) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query() query: QueryCandidateDto) {
    return this.service.findAll(query)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCandidateDto) {
    return this.service.update(id, dto)
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id)
  }
}
