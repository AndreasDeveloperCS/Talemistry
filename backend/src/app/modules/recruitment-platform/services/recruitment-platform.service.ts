import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RecruitmentPlatform, RecruitmentPlatformDocument } from '../models/recruitment-platform';

@Injectable()
export class RecruitmentPlatformService extends BaseService<RecruitmentPlatform>{

  constructor(
    @InjectModel(RecruitmentPlatform.name)
    protected readonly model: Model<RecruitmentPlatformDocument>,

    @InjectRepository(RecruitmentPlatform)
    protected readonly repository: Repository<RecruitmentPlatform>
  ) {
    super(model, repository);
  }

  public async getRecruitmentPlatforms() {

    const aggregationPipeline = [
        {
          $group: {
            _id: `$${'recruitmentPlatform'}`, // Column for which you want unique values
            count: { $sum: 1 }, // Optionally count occurrences
          },
         
        }
      ];
  
    const result =  await this.model.aggregate(aggregationPipeline);

    return result;
  }

  
}
