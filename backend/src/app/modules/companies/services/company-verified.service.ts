import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { Company, CompanyDocument } from '../models/company';
import { CompanyVersion } from '../models/company-versions';
import { User } from '../../users/models/user';

@Injectable()
export class CompanyVerifiedService extends BaseService<Company> {

    constructor(
        @InjectModel(Company.name)
        protected readonly model: Model<CompanyDocument>,

        @InjectRepository(Company)
        protected readonly repository: Repository<Company>
    ) {
        super(model, repository);
    }

    async getByCompanyVersionIdAsync(companyVersionId: string): Promise<Company | null> {
        try {
            const id = new ObjectId(companyVersionId);
            return await this.model.findOne({ companyVersionId: id }).exec();
        } catch (e) {
            return null;
        }
    }

    async createFromCompanyVersionAsync(companyVersionId: string, version: CompanyVersion, user: User): Promise<Company> {
        const versionIdObj = new ObjectId(companyVersionId);

        const entity: Company = {
            _id: versionIdObj,
            companyVersionId: versionIdObj,
            data: (version as any)?.data,
            isVerified: !!(version as any)?.isVerified,
            userId: (version as any)?.userId,
            createdBy: new ObjectId(user._id),
            createdDate: new Date(),
            sharedReadIds: [],
            sharedEditIds: [],
            sharedReadEmails: [],
            sharedEditEmails: [],
            photoGallery: [],
        } as any;

        return await this.createAsync(entity);
    }

}
