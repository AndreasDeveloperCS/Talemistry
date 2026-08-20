import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { SocialMedia, SocialMediaDocument } from '../models/social-media';
import { SocialMediaIcon } from '../models/social-media-icon';

@Injectable()
export class SocialMediaService extends BaseService<SocialMedia>{

  constructor(
    @InjectModel(SocialMedia.name)
    protected readonly model: Model<SocialMediaDocument>,

    @InjectRepository(SocialMedia)
    protected readonly repository: Repository<SocialMedia>,
  ) {
    super(model, repository);
  }

  public async getSocialMedia() {

    const aggregationPipeline = [
        {
          $group: {
            _id: `$${'socialMedia'}`, // Column for which you want unique values
            count: { $sum: 1 }, // Optionally count occurrences
          },
         
        }
      ];
  
    const result =  await this.model.aggregate(aggregationPipeline);

    return result;
  }

  public async createSocialMedia(info: any, uploaded: SocialMediaIcon): Promise<SocialMedia> {
    const entity: SocialMedia = {
      name: info.name,
      mainUrl: info.mainUrl,
      priority: info.priority,

      Bucket: uploaded.Bucket,
      Key: uploaded.Key,
      imagePath: uploaded.imagePath,
      icon: info.icon,

      createdBy: new ObjectId(info.createdBy),
      createdDate: new Date(),
      isVerified: false,
    };
    
    console.log('createSocialMedia entity', entity);

    const result = await this.createAsync(entity);
    console.log('createSocialMedia result', result);
    return result;
  }

  async updateSocialMedia(
    info: SocialMedia,
    uploadedIcon?: SocialMediaIcon
  ): Promise<SocialMedia> {

    const entityNew: SocialMedia = {
      ...info
    };

    if (uploadedIcon) {
      entityNew.Bucket = uploadedIcon.Bucket;
      entityNew.Key = uploadedIcon.Key;
      entityNew.imagePath = uploadedIcon.imagePath;
      entityNew.icon = uploadedIcon.Key;
    }

    const result = await this.updateAsync(entityNew);
    return result;
  }
}
