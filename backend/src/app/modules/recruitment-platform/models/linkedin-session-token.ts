import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectId } from 'bson';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';

@Schema({ collection: 'linkedin-sessions' })
@Entity("linkedin-sessions")
export class LinkedInSessionToken implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  userId: ObjectId;

  @Column()
  @Prop({ required: false })
  access_token: string;

  @Column()
  @Prop({ required: false })
  expires_in: number;

  @Column()
  @Prop({ required: false })
  refresh_token: string;

  @Column()
  @Prop({ required: false })
  refresh_token_expires_in: number;

  @Column()
  @Prop({ required: false })
  scope: string;

  @Column()
  @Prop({ required: false })
  token_type: string;

  @Column()
  @Prop({ required: false })
  id_token: string;

  @Column()
  @Prop({ required: false })
  user_sub: string;

  @Column()
  @Prop({ required: false, default: true })
  isValid?: boolean;


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
  modifiedDate?: Date;
}

export const LinkedInSessionTokenSchema = SchemaFactory.createForClass(LinkedInSessionToken);

export type LinkedInSessionTokenDocument = LinkedInSessionToken & Document;