import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Document } from 'mongoose';
import { Applicant } from '../models/applicant';

export type ApplicantDocument = Applicant & Document;

@Injectable()
export class ApplicantsService {
    constructor(
        @InjectModel(Applicant.name) 
        private readonly applicantModel: Model<ApplicantDocument>,
    ) { }

    async findByTelegramToken(token: string) {
        if (!token) return null;
        return this.applicantModel.findOne({ telegramConnectToken: token }).lean().exec();
    }

    async update(id: string, patch: Partial<Applicant>) {
        return this.applicantModel.findByIdAndUpdate(id, patch, { new: true }).exec();
    }

    // helper to find by id
    async findById(id: string) {
        return this.applicantModel.findById(id).lean().exec();
    }
}
