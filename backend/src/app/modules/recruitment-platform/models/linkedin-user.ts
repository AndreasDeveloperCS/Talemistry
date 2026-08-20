import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { IBaseModel } from '../../base/models/base';

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
export class LinkedInUser implements IBaseModel {

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
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ required: false, default: Date.now() })
  createdDate: Date;

  @Column()
  @Prop({ required: false, default: Date.now() })
  modifiedDate: Date;
}

export const LinkedInUserSchema = SchemaFactory.createForClass(LinkedInUser);