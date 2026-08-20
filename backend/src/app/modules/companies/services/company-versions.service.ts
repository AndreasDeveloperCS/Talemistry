import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { CompanyVersion, CompanyVersionDocument } from '../models/company-versions';
import { CompanyLogo } from '../models/company-logos';

@Injectable()
export class CompanyVersionService extends BaseService<CompanyVersion> {

    constructor(
        @InjectModel(CompanyVersion.name)
        protected readonly model: Model<CompanyVersionDocument>,

        @InjectRepository(CompanyVersion)
        protected readonly repository: Repository<CompanyVersion>
    ) {
        super(model, repository);
    }

    async getByUserIdAsync(userId: any): Promise<CompanyVersion[] | null> {
        return await this.repository.find({
            where: { userId: userId },
        });
    }

  public async createCompanyVersion(info: CompanyVersion, uploaded: CompanyLogo): Promise<CompanyVersion> {
    const entity: CompanyVersion = {
      ...info
    };
    entity.data.companyLogo = uploaded;
    
    console.log('createCompanyVersion entity', entity);

    const result = await this.createAsync(entity);
    console.log('createCompanyVersion result', result);
    return result;
  }

  async updateCompanyVersion(id: string, update: any): Promise<any> {
    const flatUpdate = flattenWithPrefix(update);

    const result = await this.model.updateOne(
        { _id: new ObjectId(id) },   
        { $set: flatUpdate, $currentDate: { modifiedDate: true } }
    );

    return result;
  }
}

function flattenWithPrefix(
  obj: any,
  parent = '',
  res: any = {},
  topLevel = true
) {
  for (const key in obj) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;

    const value = obj[key];
    const prefix =
      topLevel && !['_id', 'userId', 'companyId'].includes(key)
        ? `data.${key}`
        : key;

    const propName = parent ? `${parent}.${prefix}` : prefix;

    if (
      value instanceof ObjectId ||
      value instanceof Date ||
      Array.isArray(value) ||
      value === null ||
      (typeof value === 'object' && !topLevel) 
    ) {
      res[propName] = value;
    } else if (typeof value === 'object') {
      flattenWithPrefix(value, propName, res, false);
    } else {
      res[propName] = value;
    }
  }
  return res;
}