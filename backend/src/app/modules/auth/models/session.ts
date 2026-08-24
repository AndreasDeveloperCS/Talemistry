import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";

export type UserSessionDocument = UserSession & Document;

@Schema({ collection: 'user-session"' })
@Entity("user-session")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class UserSession implements IBaseModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    userId?: ObjectId;

    @Column()
    @Prop({ required: true })
    email: string;

    @Column()
    @Prop({ required: true })
    accessToken: string;

    @Column()
    @Prop({ required: false })
    ip?: string;

    @Column()
    @Prop({ required: false })
    refreshToken?: string;

    @Column()
    @Prop({ required: true })
    issuedAt: Date;

    @Column()
    @Prop({ required: true })
    expiringAt: Date;

    @Column()
    @Prop({ required: true, default: false })
    isActive: boolean;


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

export const UserSessionSchema = SchemaFactory.createForClass(UserSession);