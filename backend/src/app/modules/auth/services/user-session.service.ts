
import {
    Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';

import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { UserSession, UserSessionDocument } from '../models/session';
import { Model } from 'mongoose';
import { ObjectId } from 'bson';

@Injectable()
export class UserSessionService extends BaseService<UserSession> {
    constructor(
        @InjectModel(UserSession.name)
        protected readonly model: Model<UserSessionDocument>,

        @InjectRepository(UserSession)
        protected readonly repository: Repository<UserSession>

    ) {
        super(model, repository);
    }

    saveSession(userID: ObjectId, email: string, token: any, refreshToken: any) {
        this.createAsync({
            userId: userID,
            email: email,
            accessToken: token,
            refreshToken: refreshToken,
            issuedAt: new Date(),
            expiringAt: new Date(),
            isActive: true,
            createdBy: userID,
            createdDate: new Date(),
        });
    }
}

