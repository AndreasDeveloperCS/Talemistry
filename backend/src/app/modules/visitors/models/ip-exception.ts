import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";
import { ObjectId } from 'bson';

export interface IpExceptionInterface {
  userId?: string;
  ip?: string;
  isActive?: boolean;
}

@Schema({ collection: 'ip-exception' })
@Entity("ip-exception")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class IpException implements IpExceptionInterface, IBaseModel, IAuditCreated, IAuditModified {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: any;

  @Column()
  @Prop({ required: false, default: "" })
  userId?: string;

  @Column()
  @Prop({ required: false, default: "" })
  ip?: string;

  @Column()
  @Prop({ required: false, default: "" })
  city?: string;

  @Column()
  @Prop({ required: false, default: "" })
  country?: string;

  @Column()
  @Prop({ required: false, default: true })
  isActive?: boolean;

  @Column()
  @Prop({ required: false, default: 0 })
  frequency?: number;

  @Column()
  @Prop({ required: false, default: "" })
  comment?: string;

  @Column()
  @Prop({ required: false, default: Date.now() })
  dateTimeCreated?: Date;

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
  modifiedDate?: Date;
}

export type IpExceptionDocument = IpException & Document;

export const IpExceptionSchema = SchemaFactory.createForClass(IpException);
