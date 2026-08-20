import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { IAuditCreated, IAuditModified, IBaseModel } from '../../base/models/base';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';

class Locale {
  @Column()
  @Prop({ required: false, default: '' })
  country: string;

  @Column()
  @Prop({ required: false, default: '' })
  language: string;
}

export type LinkedInUserDocument = LinkedInUser & Document;

@Schema({ collection: 'linkedin-users' })
@Entity("linkedin-users")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class LinkedInUser implements IBaseModel, IAuditCreated, IAuditModified {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  sub: string;

  @Column()
  @Prop({ required: true })
  email: string;

  @Column()
  @Prop({ required: true })
  email_verified: boolean;

  @Column()
  @Prop({ required: false })
  name?: string;

  @Column()
  @Prop({ required: false })
  given_name?: string;

  @Column()
  @Prop({ required: false })
  family_name?: string;

  @Column()
  @Prop({ type: () => Locale, required: false })
  locale?: Locale;

  @Column()
  @Prop({ required: false })
  picture?: string;

  @Column()
  @Prop({ required: false })
  createdBy?: ObjectId;

  @Column()
  @Prop({ required: false, default: new Date(Date.now()) })
  createdDate?: Date;

  @Column()
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ required: false })
  modifiedDate?: Date;
}

export const LinkedInUserSchema = SchemaFactory.createForClass(LinkedInUser);