
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";

@Schema({ collection: 'currencies' })
@Entity("currencies")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class Currency implements IBaseModel, IAuditCreated, IAuditModified {

  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  name: string = ''

  @Column()
  @Prop({ required: true })
  symbol: string = ''

  @Column()
  @Prop({ required: true })
  symbolNative: string = ''


  @Column()
  @Prop({ required: true })
  decimalDigits: number = 0;


  @Column()
  @Prop({ required: true })
  rounding: number = 0;

  @Column()
  @Prop({ required: true })
  code: string = ''

  @Column()
  @Prop({ required: true })
  namePlural: string = ''

  @Column()
  @Prop({ required: true, default: new ObjectId() })
  createdBy: ObjectId = new ObjectId();

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

export type CurrencyDocument = Currency & Document;

export const CurrencySchema = SchemaFactory.createForClass(Currency);
