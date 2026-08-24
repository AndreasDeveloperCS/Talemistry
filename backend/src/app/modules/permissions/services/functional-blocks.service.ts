import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { FunctionalBlock, FunctionalBlockDocument } from '../models/functional-block';

@Injectable()
export class FunctionalBlocksService extends BaseService<FunctionalBlock> {

    constructor(
        @InjectModel(FunctionalBlock.name)
        protected readonly model: Model<FunctionalBlockDocument>,

        @InjectRepository(FunctionalBlock)
        protected readonly repository: Repository<FunctionalBlock>

    ) {
        super(model, repository);
    }

    async getMaxRegisterValue(): Promise<number> {
        const max = await this.model.findOne().sort({ registerValue: -1 }).exec();
        return max?.registerValue ?? 0;
    }

    async getBlockIdByRoute(route: string): Promise<FunctionalBlock> {
        const entity = await this.model.findOne({ endpointRoute: route });
        //console.log(route, entity);
        return entity;
    }

    async getFunctionalBlockByRoute(endpointRoute: string): Promise<FunctionalBlock> {
        const item = await this.repository.findOneBy({ endpointRoute: endpointRoute });
        return item;
    }
}