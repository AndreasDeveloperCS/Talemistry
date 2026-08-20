import { Injectable } from '@nestjs/common';
import { UserSocialMedia, UserSocialMediaDocument } from '../models/user-social-media';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class UserSocialMediaService extends BaseService<UserSocialMedia>{ 
    
  constructor(
    @InjectModel(UserSocialMedia.name)
    protected readonly model: Model<UserSocialMediaDocument>,

    @InjectRepository(UserSocialMedia)
    protected readonly repository: Repository<UserSocialMedia>
  ) {
    super(model, repository);
  }
}
