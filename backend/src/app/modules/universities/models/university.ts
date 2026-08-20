import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from "../../base/models/base";
import { ObjectId } from "bson";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";

@Schema({ collection: 'universities' })
@Entity("universities")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class University implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified, IOwnerModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  userId: ObjectId;

  @Column()
  @Prop({ required: false, default: "" })
  country: string;

  @Column()
  @Prop({ required: false, default: [] })
  domains: string[] = [];

  @Column('alpha_two_code')
  @Prop({ name: 'alpha_two_code', required: false, default: "" })
  alpha_two_code: string[];

  @Column('state-province')
  @Prop({ name: 'state-province', required: false, default: "" })
  stateProvince: string;

  @Column('web_pages')
  @Prop({ name: 'web_pages', required: false, default: [] })
  web_pages: string[];

  @Column('name')
  @Prop({ name: 'name', required: false, default: "" })
  name: string;

  @Column('isVerified')
  @Prop({ name: 'isVerified', required: false, default: false })
  isVerified: boolean = false;

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

export type UniversityDocument = University & Document;

export const UniversitySchema = SchemaFactory.createForClass(University);
