import { Controller, Get, Query } from '@nestjs/common'
import { ApiTags, ApiQuery } from '@nestjs/swagger'
import { LiveAnalyticsService, LiveFilters } from './live-analytics.service'

/**
 * Read-only analytics computed from the REAL `evryka` collections.
 * GET /api/v1/live/analytics?range=12m&recruiterId=all&skill=all&viewerId=all
 */
@ApiTags('live-analytics')
@Controller('live/analytics')
export class LiveAnalyticsController {
  constructor(private readonly service: LiveAnalyticsService) {}

  @Get()
  @ApiQuery({ name: 'range', required: false })
  @ApiQuery({ name: 'viewerId', required: false })
  @ApiQuery({ name: 'recruiterId', required: false })
  @ApiQuery({ name: 'skill', required: false })
  overview(
    @Query('range') range = '12m',
    @Query('viewerId') viewerId = 'all',
    @Query('recruiterId') recruiterId = 'all',
    @Query('skill') skill = 'all',
  ) {
    const filters: LiveFilters = { range, viewerId, recruiterId, skill }
    return this.service.overview(filters)
  }
}
