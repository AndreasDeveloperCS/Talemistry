import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { CurrentCompany, CurrentCompanyDocument } from '../models/current-company';
import { ObjectId } from 'bson';
import { PaymentSubscriptionState } from '../../payments/dto/payments.dto';

@Injectable()
export class CurrentCompanyService extends BaseService<CurrentCompany> {

    constructor(
        @InjectModel(CurrentCompany.name)
        protected readonly model: Model<CurrentCompanyDocument>,

        @InjectRepository(CurrentCompany)
        protected readonly repository: Repository<CurrentCompany>
    ) {
        super(model, repository);
    }

    async getByUserIdAsync(userId: any): Promise<CurrentCompany | null> {
        return await this.repository.findOne({
            where: { userId: userId },
        });
    }

    async upsertPaymentSubscriptionStateByUserId(userId: string | ObjectId, billing: PaymentSubscriptionState): Promise<void> {
        const userObjectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

        await this.model.updateOne(
            { userId: userObjectId },
            {
                $set: {
                    billing,
                    modifiedBy: userObjectId,
                    modifiedDate: new Date(),
                },
                $setOnInsert: {
                    userId: userObjectId,
                    createdBy: userObjectId,
                    createdDate: new Date(),
                },
            },
            { upsert: true },
        ).exec();
    }
}
