import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { IpException, IpExceptionDocument } from '../models/ip-exception';


@Injectable()
export class IpExceptionsService extends BaseService<IpException>{

  constructor(
    @InjectModel(IpException.name)
    protected readonly model: Model<IpExceptionDocument>,

    @InjectRepository(IpException)
    protected readonly repository: Repository<IpException>
  ) {
    super(model, repository);
  }
 
}
