import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IBaseModel, IOwnerModel } from '../../base/models/base';

@Schema({ collection: 'telegram-notifications' })
@Entity("telegram-notifications")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel)
export class TelegramNotification implements IBaseModel, IAuditCreated, IOwnerModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    roomId: ObjectId;

    @Column()
    @Prop({ required: true })
    content: string;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();
}

export const TelegramNotificationSchema = SchemaFactory.createForClass(TelegramNotification);

export type TelegramNotificationDocument = TelegramNotification & Document;