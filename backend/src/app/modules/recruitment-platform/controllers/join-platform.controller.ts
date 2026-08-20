import { Body, Controller, Get, Post } from '@nestjs/common';
import { JoinAdapterService } from '../services/join-adapter.service';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { EmptyModel } from '../../base/models/empty-model';

@Controller('join')
export class JoinController
//extends BaseController<EmptyModel> 
{

    constructor(protected readonly service: JoinAdapterService,
        // protected moduleRef: ModuleRef,
    ) {
        // super(service, moduleRef);
    }

    @Get('jobs')
    async getAllJobs() {
        // console.log('JoinController, getAllJobs');
        return this.service.getAllJobs();
    }

    @Post('jobs')
    async createJob(@Body() jobData: any) {
        // console.log('JoinController, createJob');
        return this.service.createJob(jobData);
    }
}