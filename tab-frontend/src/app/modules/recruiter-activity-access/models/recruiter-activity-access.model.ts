import { User } from "../../authentication/models/user";

export enum ActivityAccessStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Rejected = 'rejected',
}

export class RecruiterActivityAccess {
    _id?: any;
    supervisorId!: any;      // recruiter who shares activity
    recruiterId!: any;     // recruiter who can view it
    status: ActivityAccessStatus = ActivityAccessStatus.Pending;
    acceptedDate?: Date;
    userId?: any;
    createdDate: Date = new Date();
    createdBy?: string;
    modifiedDate?: Date;
    modifiedBy?: string;
}

export interface RecruiterActivityAccessView {
    access: RecruiterActivityAccess;
    recruiter: User;
}

export interface ActivityAccessResponse {
    pendingRequestsSent: RecruiterActivityAccess[];
    pendingRequestsReceived: RecruiterActivityAccess[];
    supervisedRecruiters: RecruiterActivityAccess[];
    mySupervisors: RecruiterActivityAccess[];
}

export interface RecruiterSearchResult {
    _id: string;
    fullName: string;
    email: string;
    photo?: string;
}