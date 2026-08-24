import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { IsOptional } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ROLES } from '../../../common/enums';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';
import { IUser } from '../interfaces/user.interface';
import { DEFAULT_NOTIFICATION_PREFERENCES, MessageNotificationPreferences } from '../../communication/enums/communication-means.enum';
import { PaymentSubscriptionState } from '../../payments/dto/payments.dto';

export class TelegramNotification {
  chatId: string;
  username?: string;
  enabled: boolean;
  connectToken?: string;
  connectTokenExpiresAt?: Date;
  linkedAt: Date;
}

@Schema({ collection: 'users' })
@Entity("users")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class User implements IBaseModel, IUser, IAuditCreated, IAuditModified, IOwnerModel {

  login?: string;

  @Column()
  @PrimaryGeneratedColumn()
  _id: ObjectId;

  @Column()
  @Prop({ required: true })
  userId: ObjectId;

  @Column()
  @Prop({ required: false, default: "" })
  title: string = '';

  @Column()
  @Prop({ required: false })
  photo?: string;

  @Column()
  @Prop({ required: true })
  firstname: string;

  @Column()
  @Prop({ required: true })
  lastname: string;

  @Column()
  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Column({ name: 'phone' })
  @Prop({ name: 'phone', required: true, default: "" })
  phone: string;

  @Column({ nullable: true })
  @Prop({ required: false, unique: true, sparse: true, lowercase: true, trim: true })
  username?: string;

  @Column()
  @Prop({ type: TelegramNotification, required: false })
  telegram: TelegramNotification;

  @Prop({
    required: true,
    type: Object,
    default: DEFAULT_NOTIFICATION_PREFERENCES,
  })
  messageNotificationPreferences: MessageNotificationPreferences;

  @Column()
  @Prop({ required: false })
  password?: string;

  @Column('simple-json', { nullable: true })
  @Prop({ required: false, type: Object })
  paymentSubscription?: PaymentSubscriptionState;

  @Column()
  @IsOptional()
  @Prop({ required: false, default: false })
  isVerifiedEmail: boolean;

  @Column()
  @IsOptional()
  @Prop({ required: false, default: false })
  isVerifiedPhone: boolean;

  @Column()
  @Prop({ required: true })
  role: ROLES[] | string[];

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

export type UserDocument = User & Document;
export const UserSchema = SchemaFactory.createForClass(User);