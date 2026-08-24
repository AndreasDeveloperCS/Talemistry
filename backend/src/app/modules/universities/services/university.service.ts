import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model, PipelineStage } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { University, UniversityDocument } from '../models/university';
import { ObjectId } from 'bson';

@Injectable()
export class UniversityService extends BaseService<University> {

    constructor(
      @InjectModel(University.name)
      protected readonly model: Model<UniversityDocument>,
  
      @InjectRepository(University)
      protected readonly repository: Repository<University>
    ) {
      super(model, repository);
    }

    public async getCountries() {

      const aggregationPipeline: PipelineStage[] = [
          {
            $group: {
              _id: `$${'country'}`, // Column for which you want unique values
              count: { $sum: 1 }, // Optionally count occurrences
            },
          },
          {
            $sort: {
              _id: 1, // Sort by count in descending order (-1 for descending)
            },
          },
        ];
    
      const result =  await this.model.aggregate(aggregationPipeline);
  
      return result;
    }

    async createIfNotExists(dto: Partial<University>, userId: ObjectId) {

        const name = dto.name?.trim();
        if (!name) {
            throw new BadRequestException('`name` is required');
        }

        const now = new Date();

        const filter = { name };
        const update = {
            $setOnInsert: {
                name,
                country: dto.country ?? [],
                domains: dto.domains ?? [],
                alpha_two_code: dto.alpha_two_code ?? [],
                web_pages: dto.web_pages ?? [],
                stateProvince: dto.stateProvince ?? '',
                isVerified: dto.isVerified ?? false,
                userId: userId,
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

        console.log(`University res:`, res);
        const insertedEntity: University = { ...res.toObject(), _id: res._id };
        console.log(`University insertedEntity:`, insertedEntity);
        return insertedEntity;
    }
}