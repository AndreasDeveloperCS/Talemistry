import { User } from "../../users/models/user";
import { Participant } from '../../../common/dto/participant';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel } from "../../base/models/base";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { ObjectId } from "bson";

export enum InterviewStatus {
  isPlanned = "In Progress",
  inProgress = "In Planned",
  isCompleted = "Completed",
  isCancelled = "Cancelled",
}
@Schema({ collection: 'interviews' })
@Entity("interviews")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedModel)
export class Interview implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  userId: ObjectId;

  cvInfoId?: string;
  candidateId?: string;
  positionId?: string;
  roomId?: string;
  joinLink?: string;

  participants?: Participant[] = [];

  timeZone: any;
  expectedStart: Date = new Date();
  expectedEnd: Date = new Date();

  status?: InterviewStatus;

  // interviewTasks?: InterviewTask[];
  // interviewFeedbacks?: InterviewFeedback[];
  nextStage?: boolean;

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

export const InterviewSchema = SchemaFactory.createForClass(Interview);

export type InterviewDocument = Interview & Document;