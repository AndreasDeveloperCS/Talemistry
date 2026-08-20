import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel } from '../../base/models/base';
import { OpenPosition } from '../../positions/models/open-position';
import { User } from '../../users/models/user';
import { CoverLetter } from './cover-letter-info';
import { InfoCvDto } from './info-cv';
import { CandidateInfo } from './candidate-info';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';

@Schema({ collection: 'position-applied' })
@Entity("position-applied")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedEmailsReadModel)
export class PositionApplied implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Prop({ required: true })
  userId: ObjectId;

  @Prop({ type: ObjectId, ref: "User" })
  candidateProfile?: User;

  @Column()
  @Prop({ type: CandidateInfo, required: false })
  candidateInfo?: CandidateInfo;

  @Prop({ required: true })
  positionId?: ObjectId;

  @Prop({ type: ObjectId, ref: "OpenPosition" })
  position?: OpenPosition;

  @Prop({ required: true })
  cvId: ObjectId;

  @Prop({ type: ObjectId, ref: "InfoCv" })
  cv: InfoCvDto;

  @Prop({ required: false })
  coverLetterId?: ObjectId;

  @Prop({ type: ObjectId, ref: "CoverLetter" })
  coverLetter?: CoverLetter;

  @Prop({ required: false })
  ip?: string;

  @Prop({ required: false })
  mac?: string;

  @Column()
  @Prop({ required: true })
  sharedReadIds: ObjectId[];

  @Column()
  @Prop({ required: true })
  sharedReadEmails: string[];

  @Column()
  @Prop({ required: false })
  createdBy?: ObjectId;

  @Column()
  @Prop({ required: false, default: new Date(Date.now()) })
  createdDate?: Date = new Date();

  @Column()
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ default: Date.now() })
  modifiedDate?: Date;
}

export type PositionAppliedDocument = PositionApplied & Document;

export const PositionAppliedSchema = SchemaFactory.createForClass(PositionApplied);
