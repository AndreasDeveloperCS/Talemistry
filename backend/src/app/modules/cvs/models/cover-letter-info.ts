import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel } from '../../base/models/base';
import { IUser } from '../../users/interfaces/user.interface';
import { CandidateInfo } from './candidate-info';
import { FileInfo } from './file-info';


@Schema({ collection: 'cover-letter-cv' })
@Entity("cover-letter-cv")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedIdsReadModel)
export class CoverLetter implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  userId: ObjectId;

  @Column()
  @Prop({ type: ObjectId, ref: "User" })
  candidateProfile?: IUser;

  @Column()
  @Prop({ type: CandidateInfo, required: false })
  candidateInfo?: CandidateInfo;

  @Column()
  @Prop({ required: true, default: false })
  isMain: boolean = false;

  @Column()
  @Prop({ required: true, default: false })
  gdprConfirmed: boolean = false;

  @Column('coverLetterText')
  @Prop({ required: false, default: '' })
  coverLetterText: string = '';

  @Column()
  @Prop({ type: FileInfo, ref: "FileInfo" })
  coverLetterFileInfo?: FileInfo;

  @Column('isFile')
  @Prop({ required: false, default: false })
  isFile: boolean = false;

  @Column()
  @Prop({ type: String, required: false })
  originalName?: string;

  @Column()
  @Prop({ type: Date, required: false })
  fileLastModifiedDate?: Date;

  @Column()
  @Prop({ type: Number, required: false })
  size?: number;

  @Column()
  @Prop({ required: false })
  ip?: string;

  @Column()
  @Prop({ required: false })
  mac?: string;

  @Column()
  @Prop({ required: true })
  sharedReadIds: ObjectId[];

  @Column()
  @Prop({ required: true })
  sharedReadEmails: string[];

  @Column()
  @Prop({ required: true })
  createdBy: ObjectId;

  @Column()
  @Prop({ required: true, default: new Date(Date.now()) })
  createdDate: Date = new Date();

  @Column()
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ default: Date.now() })
  modifiedDate?: Date;
}

export type CoverLetterDocument = CoverLetter & Document;

export const CoverLetterSchema = SchemaFactory.createForClass(CoverLetter);
