import { Body, Controller, Get, Post } from '@nestjs/common';
import { WorkableAdapterService } from '../services/workable-adapter.service';
import { WorkableRequisition } from '../models/requisition';

@Controller('workable')
export class WorkableController {
    constructor(private readonly workableService: WorkableAdapterService) {
        // console.log('WorkableAdapterService:', this.workableService);
    }

    @Get('jobs')
    async getJobs() {
        // console.log('WorkableController - getJobs() called');
        return await this.workableService.getJobs();
    }

    @Post('requisition')
    async createRequisition(@Body() createRequisitionDto: WorkableRequisition) {
        return this.workableService.createRequisition(createRequisitionDto);
    }
}
