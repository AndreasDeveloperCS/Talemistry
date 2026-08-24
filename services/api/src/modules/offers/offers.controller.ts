import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { OffersService } from './offers.service'
import { Offer, OfferStatus } from './schemas/offer.schema'

@ApiTags('offers')
@Controller('offers')
export class OffersController {
  constructor(private readonly service: OffersService) {}

  @Post()
  create(@Body() dto: Partial<Offer>) {
    return this.service.create(dto)
  }

  @Get()
  findAll(@Query('status') status?: OfferStatus) {
    return this.service.findAll(status)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id)
  }

  @Patch(':id/status')
  transition(@Param('id') id: string, @Body('status') status: OfferStatus) {
    return this.service.transition(id, status)
  }

  @Patch(':id/approve')
  approve(@Param('id') id: string, @Body('approver') approver: string) {
    return this.service.approve(id, approver)
  }
}
