import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { PositionBenefit, PositionBenefitDocument } from '../models/position-benefit';
import { ObjectId } from 'bson';

@Injectable()
export class PositionBenefitsService extends BaseService<PositionBenefit> {

    constructor(
        @InjectModel(PositionBenefit.name)
        protected readonly model: Model<PositionBenefitDocument>,

        @InjectRepository(PositionBenefit)
        protected readonly repository: Repository<PositionBenefit>
    ) {
        super(model, repository);
    }

    async createIfNotExists(dto: Partial<PositionBenefit>, userId: ObjectId) {

        const benefit = dto.benefit?.trim();
        if (!benefit) {
            throw new BadRequestException('`benefit` is required');
        }

        const now = new Date();

        const filter = { benefit };
        const update = {
            $setOnInsert: {
                benefit,
                subgroups: dto.subgroups ?? [],
                isVerified: true,
                createdBy: dto.createdBy ?? userId,
                createdDate: now,
            },
            $set: {
                modifiedBy: dto.modifiedBy ?? userId,
                modifiedDate: now,
            },
        };


        const res = await this.model.findOneAndUpdate(filter, update, {
            upsert: true,
            new: true,
            rawResult: true,
            setDefaultsOnInsert: true
        });

        console.log(`PositionBenefit res:`, res);
        const insertedEntity: PositionBenefit = { ...res.toObject(), _id: res._id };
        console.log(`PositionBenefit insertedEntity:`, insertedEntity);
        return insertedEntity;
    }
}
