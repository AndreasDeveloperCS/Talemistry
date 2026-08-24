import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserRecruitmentPlatform, UserRecruitmentPlatformDocument } from '../models/user-recruitment-platform';

@Injectable()
export class UserRecruitmentPlatformService extends BaseService<UserRecruitmentPlatform>{

  constructor(
    @InjectModel(UserRecruitmentPlatform.name)
    protected readonly model: Model<UserRecruitmentPlatformDocument>,

    @InjectRepository(UserRecruitmentPlatform)
    protected readonly repository: Repository<UserRecruitmentPlatform>
  ) {
    super(model, repository);
  }

  public async getUserRecruitmentPlatforms() {

    const aggregationPipeline = [
        {
          $group: {
            _id: `$${'userTecruitmentPlatform'}`, // Column for which you want unique values
            count: { $sum: 1 }, // Optionally count occurrences
          },
         
        }
      ];
  
    const result =  await this.model.aggregate(aggregationPipeline);

    return result;
  }

  
}