import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel, ISharedReadModel } from '../../base/models/base';
import { IUser } from '../../users/interfaces/user.interface';
import { CandidateInfo } from './candidate-info';
import { FileInfo } from './file-info';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';

@Schema({ collection: 'info-cv' })
@Entity("info-cv")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel, INTERFACES.SharedEmailsReadModel)
export class InfoCvDto implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

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

  @Column()
  @Prop({ type: FileInfo, ref: "FileInfo" })
  cvFileInfo?: FileInfo = new FileInfo();

  @Column()
  @Prop({ type: String, required: true })
  originalName?: string;

  @Column()
  @Prop({ type: Date, required: true })
  fileLastModifiedDate?: Date;

  @Column()
  @Prop({ type: Number, required: true })
  size?: number;

  @Column()
  @Prop({ type: String, required: false })
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
  @Prop({ required: false, default: new Date(Date.now()) })
  modifiedDate?: Date;
}

export type InfoCvDocument = InfoCvDto & Document;

export const InfoCvSchema = SchemaFactory.createForClass(InfoCvDto);
