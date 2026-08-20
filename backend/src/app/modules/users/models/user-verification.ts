import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { IsOptional } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { VerificationType } from '../../../common/enums';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IBaseModel, IVerifiableModel } from '../../base/models/base';

export type VerificationRequestDocument = VerificationRequest & Document;

@Schema({ collection: 'verification-requests' })
@Entity("verification-requests")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class VerificationRequest implements IBaseModel, IVerifiableModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  verificationType: VerificationType;

  @IsOptional()
  @Prop({ required: false, default: null })
  generatedOtp: string;

  @IsOptional()
  @Prop({ required: false, default: null })
  userOtp: string;

  @IsOptional()
  @Prop({ required: false, default: false })
  isVerified: boolean;


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

export const VerificationRequestSchema = SchemaFactory.createForClass(VerificationRequest);
