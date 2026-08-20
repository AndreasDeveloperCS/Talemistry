import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn, } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { JobResponsibilities, PositionBenefits, PositionDetails, PositionItem, PositionRequirement, PositionStatus, PositionSummary, ProjectDescription } from './position-item';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel, IVerifiableModel } from '../../base/models/base';
import { ICustomPosition } from './custom-position';

@Schema({ collection: 'open-positions' })
@Entity('open-positions')
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.CustomPosition, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class OpenPosition implements IBaseModel, ICustomPosition, IVerifiableModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id: ObjectId;

  @Column()
  @Prop({ required: false })
  userId: ObjectId;

  @Column(type => PositionItem)
  @Prop({ required: false, default: [] })
  positionElements: PositionItem[] = [];

  @Column(type => PositionDetails)
  @Prop({ required: false, default: PositionDetails })
  positionDetails: PositionDetails = new PositionDetails();

  @Column()
  @Prop({ required: false })
  projectDescription: ProjectDescription = new ProjectDescription();

  @Column()
  @Prop({ required: true })
  title: string = '';

  @Column()
  @Prop({ required: false })
  titleCode: string = '';

  @Column()
  @Prop({ required: true, default: PositionStatus.ACTIVE })
  status: PositionStatus;

  @Column()
  @Prop({ required: false })
  jobResponsibilities: JobResponsibilities = new JobResponsibilities();

  @Column()
  @Prop({ required: false })
  requirements: PositionRequirement = new PositionRequirement();

  @Column()
  @Prop({ required: false })
  benefits: PositionBenefits = new PositionBenefits();

  @Column()
  @Prop({ required: false })
  summary: PositionSummary = new PositionSummary();

  @Column()
  @Prop({ required: false, default: true })
  isVerified: boolean = true;

  @Column()
  @Prop({ required: false })
  sharedReadIds: ObjectId[] = [];

  @Column()
  @Prop({ required: false })
  sharedReadEmails: string[] = [];

  @Column()
  @Prop({ required: false })
  sharedEditIds: ObjectId[] = [];

  @Column()
  @Prop({ required: false })
  sharedEditEmails: string[] = [];

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
  @Prop({ required: false })
  modifiedDate: Date;
}

export const OpenPositionSchema = SchemaFactory.createForClass(OpenPosition);

export type OpenPositionDocument = OpenPosition & Document;
