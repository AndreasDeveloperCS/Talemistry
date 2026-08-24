
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { TimeSpan } from "../../base/models/time-span";
import { TimeSlot } from "./schedule-settings";

import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel } from '../../base/models/base';
import { IUser } from "../../users/interfaces/user.interface";
import { MeetingLinks } from "./meeting-links";
import { ZoomMeeting } from './zoom';
import { TeamsMeeting } from './teams';
import { GoogleMeet } from './google-meet';

export enum MeetingPlatfrom {
    EVRYKA,
    GOOGLE_MEET,
    TEAMS,
    ZOOM
}

export interface ParticipantInfo {
    firstname: string;
    lastname: string;
    email: string;
}

export enum MeetingStatus {
    draft,
    requested,
    confirmed,
    cancelled,
    tentative,
}

@Schema({ collection: 'meetings' })
@Entity("meetings")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class Meeting implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ type: ObjectId, ref: "User", required: false })
    meetingOrganizer?: IUser;

    @Column()
    @Prop({ required: false })
    positionId?: ObjectId;
    
    @Column()
    @Prop({ required: false })
    invitationId?: ObjectId;

    @Column()
    @Prop({ required: true })
    participants: ParticipantInfo[] = [];

    @Column()
    @Prop({ required: true })
    topic: string = '';

    @Column()
    @Prop({ required: false })
    agenda: string = '';

    @Column()
    @Prop({ required: true })
    timeSlot: TimeSlot = new TimeSlot();

    @Column()
    @Prop({ required: true })
    date: Date = new Date();

    @Column()
    @Prop({ required: true })
    startTime: Date = new Date();

    @Column()
    @Prop({ required: true })
    duration: TimeSpan = new TimeSpan();

    @Column()
    @Prop({ required: true })
    endTime?: Date = new Date();

    @Column()
    @Prop({ required: false })
    timeZone?: string;

    @Column()
    @Prop({ type: MeetingLinks, required: true, default: new MeetingLinks() })
    meetingLinks: MeetingLinks = new MeetingLinks();

    @Column()
    @Prop({ required: true })
    platform?: MeetingPlatfrom = MeetingPlatfrom.EVRYKA;

    @Column()
    @Prop({ required: false })
    meetingLinkEvryka: string = '';

    @Column()
    @Prop({ required: false })
    meetingLinkGoogleMeets: GoogleMeet = new GoogleMeet();

    @Column()
    @Prop({ required: false })
    meetingLinkTeams: TeamsMeeting = new TeamsMeeting();

    @Column()
    @Prop({ required: false })
    meetingLinkZoom: ZoomMeeting = new ZoomMeeting();

    @Column()
    @Prop({ required: true })
    status: MeetingStatus = MeetingStatus.draft;

    @Column()
    @Prop({ required: true })
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedReadEmails: string[];

    @Column()
    @Prop({ required: true })
    sharedEditIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedEditEmails: string[];

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate: Date;
}

export const MeetingSchema = SchemaFactory.createForClass(Meeting);
export type MeetingDocument = Meeting & Document;