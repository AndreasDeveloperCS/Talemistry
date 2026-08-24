
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from "../../base/models/base";

@Schema({ collection: 'education' })
@Entity("education")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class Education implements IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified, IOwnerModel {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  name: string = '';

  @Column()
  @Prop({ required: true })
  userId: ObjectId;

  @Column()
  @Prop({ required: true })
  isVerified: boolean;

  @Column()
  @Prop({ required: true })
  createdBy: ObjectId;

  @Column()
  @Prop({ required: true, default: new Date(Date.now()) })
  createdDate: Date;

  @Column()
  @Prop({ required: false })
  modifiedBy?: ObjectId;

  @Column()
  @Prop({ required: false })
  modifiedDate?: Date;

}

export type EducationDocument = Education & Document;

export const EducationSchema = SchemaFactory.createForClass(Education);