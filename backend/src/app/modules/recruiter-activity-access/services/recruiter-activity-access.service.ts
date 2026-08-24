import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { ActivityAccessStatus, RecruiterActivityAccess, RecruiterActivityAccessDocument } from '../models/recruiter-activity-access.model';
import { User } from '../../users/models/user';
import { ObjectId } from 'bson';
import { UsersService } from '../../users/services/user.service';
import { ROLES } from '../../../common/enums';

export interface RecruiterActivityAccessView {
    access: RecruiterActivityAccess;
    recruiter: User;
}

export interface ActivityAccessResponse {

    /**
     * Requests I have sent to recruiters
     * (waiting for their approval)
     */
    pendingRequestsSent: RecruiterActivityAccess[];

    /**
     * Requests sent to me by supervisors
     * (waiting for my approval)
     */
    pendingRequestsReceived: RecruiterActivityAccess[];

    /**
     * Recruiters whose activity I can supervise
     */
    supervisedRecruiters: RecruiterActivityAccess[];

    /**
     * Supervisors who can view my activity
     */
    mySupervisors: RecruiterActivityAccess[];
}

export interface RecruiterSearchResult {
    _id: ObjectId;
    fullName: string;
    email: string;
    photo?: string;
}

@Injectable()
export class RecruiterActivityAccessService extends BaseService<RecruiterActivityAccess> {

    constructor(
        @InjectModel(RecruiterActivityAccess.name)
        protected readonly model: Model<RecruiterActivityAccessDocument>,

        @InjectRepository(RecruiterActivityAccess)
        protected readonly repository: Repository<RecruiterActivityAccess>,
        protected readonly usersService: UsersService,
    ) {
        super(model, repository);
    }

    async getMyActivityAccess(userId?: ObjectId): Promise<ActivityAccessResponse> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        const all = await this.repository.find({
            where: {
                $or: [
                    { ownerId: userIdObj },
                    { viewerId: userIdObj }
                ]
            } as any
        });

        const pendingRequestsSent: RecruiterActivityAccess[] = [];
        const pendingRequestsReceived: RecruiterActivityAccess[] = [];
        const supervisedRecruiters: RecruiterActivityAccess[] = [];
        const mySupervisors: RecruiterActivityAccess[] = [];

        for (const access of all) {

            if (
                access.supervisorId.equals(userIdObj) &&
                access.status === ActivityAccessStatus.Pending
            ) {
                pendingRequestsSent.push(access);
            }
            else if (
                access.supervisorId.equals(userIdObj) &&
                access.status === ActivityAccessStatus.Accepted
            ) {
                supervisedRecruiters.push(access);
            }
            else if (
                access.recruiterId.equals(userIdObj) &&
                access.status === ActivityAccessStatus.Pending
            ) {
                pendingRequestsReceived.push(access);
            }
            else if (
                access.recruiterId.equals(userIdObj) &&
                access.status === ActivityAccessStatus.Accepted
            ) {
                mySupervisors.push(access);
            }

        }

        return {
            pendingRequestsSent,
            pendingRequestsReceived,
            supervisedRecruiters,
            mySupervisors
        };
    }

    async searchRecruitersByEmail(currentUser: User, email: string): Promise<RecruiterSearchResult> {
        const recruiter = await this.usersService.findByEmail(email);
        if (!recruiter) {
            return null;
        }
        if(currentUser.email === email) {
            return null;
        }
        const recruiterRoles = [ROLES.HR, ROLES.HM, ROLES.RC];
        const roles = recruiter.role ?? [];
        const isRecruiter = recruiterRoles.some(role => roles.includes(role));

        if (!isRecruiter) {
            return null;
        }
        return {
            _id: recruiter._id,
            fullName: recruiter.firstname + ' ' + recruiter.lastname,
            email: recruiter.email,
            photo: recruiter.photo
        };
    }

    async findExistingRequest(recruiterId: ObjectId | string, supervisorId: ObjectId | string): Promise<RecruiterActivityAccess | null> {
        const recruiterIdObj = typeof recruiterId === 'string' ? new ObjectId(recruiterId) : recruiterId;
        const supervisorIdObj = typeof supervisorId === 'string' ? new ObjectId(supervisorId) : supervisorId;
        return await this.repository.findOne({
            where: {
                recruiterId: recruiterIdObj,
                supervisorId: supervisorIdObj
            } as any
        });
    }
}