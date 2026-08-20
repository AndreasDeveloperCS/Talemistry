
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IBaseModel } from "../../base/models/base";

@Schema({ collection: 'countries' })
@Entity("countries")
@Implements(INTERFACES.BaseModel)
export class Country implements IBaseModel {
  @Column()
  @PrimaryGeneratedColumn()
  _id?: ObjectId;

  @Column()
  @Prop({ required: true })
  name: string = ''

  @Column()
  @Prop({ required: true })
  code: string = ''
}

export type CountryDocument = Country & Document;

export const CountrySchema = SchemaFactory.createForClass(Country);