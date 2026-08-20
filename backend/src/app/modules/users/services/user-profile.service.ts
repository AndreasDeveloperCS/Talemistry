import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { User, UserDocument } from '../models/user';

import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';

@Injectable()
export class UserProfileService extends BaseService<User> {

  constructor(
    @InjectModel(User.name)
    protected readonly model: Model<UserDocument>,

    @InjectRepository(User)
    protected readonly repository: Repository<User>) {
    super(model, repository);
  }

}
