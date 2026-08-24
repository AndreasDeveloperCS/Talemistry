import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { CompanyBenefit, CompanyBenefitDocument } from '../models/company-benefits';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'bson';

@Injectable()
export class CompanyBenefitsService extends BaseService<CompanyBenefit> {

    constructor(
        @InjectModel(CompanyBenefit.name)
        protected readonly model: Model<CompanyBenefitDocument>,

        @InjectRepository(CompanyBenefit)
        protected readonly repository: Repository<CompanyBenefit>
    ) {
        super(model, repository);
    }

    async createIfNotExists(dto: Partial<CompanyBenefit>, userId: ObjectId) {

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

        console.log(`CompanyBenefit res:`, res);
        const insertedEntity: CompanyBenefit = { ...res.toObject(), _id: res._id };
        console.log(`CompanyBenefit insertedEntity:`, insertedEntity);
        return insertedEntity;
    }
}
