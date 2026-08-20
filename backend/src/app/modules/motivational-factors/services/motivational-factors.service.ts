import { BadRequestException, Injectable } from '@nestjs/common';
import { MotivationalFactor, MotivationalFactorDocument } from '../models/motivational-factor';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { ObjectId } from 'bson';

@Injectable()
export class MotivationalFactorsService extends BaseService<MotivationalFactor>{

    constructor(
        @InjectModel(MotivationalFactor.name)
        protected readonly model: Model<MotivationalFactorDocument>,
    
        @InjectRepository(MotivationalFactor)
        protected readonly repository: Repository<MotivationalFactor>
    ) {
        super(model, repository);
    }
    
    async createIfNotExists(dto: Partial<MotivationalFactor>, userId: ObjectId) {

        const factor = dto.factor?.trim();
        if (!factor) {
            throw new BadRequestException('`motivational factor` is required');
        }

        const now = new Date();

        const filter = { factor };
        const update = {
            $setOnInsert: {
                factor,
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

        console.log(`MotivationalFactor res:`, res);
        const insertedEntity: MotivationalFactor = { ...res.toObject(), _id: res._id };
        console.log(`MotivationalFactor insertedEntity:`, insertedEntity);
        return insertedEntity;
    }
}
