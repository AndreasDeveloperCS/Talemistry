import { BadRequestException, Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ObjectId } from 'bson';
import { CompanyValue, CompanyValueDocument } from '../models/company-values';

@Injectable()
export class CompanyValuesService extends BaseService<CompanyValue> {

    constructor(
        @InjectModel(CompanyValue.name)
        protected readonly model: Model<CompanyValueDocument>,

        @InjectRepository(CompanyValue)
        protected readonly repository: Repository<CompanyValue>
    ) {
        super(model, repository);
    }

    async createIfNotExists(dto: Partial<CompanyValue>, userId: ObjectId) {

        const value = dto.value?.trim();
        if (!value) {
            throw new BadRequestException('`value` is required');
        }

        const now = new Date();

        const filter = { value };
        const update = {
            $setOnInsert: {
                value,
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

        console.log(`CompanyValue res:`, res);
        const insertedEntity: CompanyValue = { ...res.toObject(), _id: res._id };
        console.log(`CompanyValue insertedEntity:`, insertedEntity);
        return insertedEntity;
    }
}