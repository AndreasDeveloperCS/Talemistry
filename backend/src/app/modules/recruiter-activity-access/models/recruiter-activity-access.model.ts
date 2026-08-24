import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";

export enum ActivityAccessStatus {
    Pending = 'pending',
    Accepted = 'accepted',
    Rejected = 'rejected',
}

@Schema({ collection: 'recruiter-activity-access' })
@Entity("recruiter-activity-access")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class RecruiterActivityAccess implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @PrimaryGeneratedColumn()
    supervisorId?: ObjectId;

    @Column()
    @PrimaryGeneratedColumn()
    recruiterId?: ObjectId;

    @Column()
    @Prop({ required: true, enum: Object.values(ActivityAccessStatus), default: ActivityAccessStatus.Pending })
    status: ActivityAccessStatus;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true, default: () => new Date() })
    acceptedDate?: Date;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: () => new Date() })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: () => new Date() })
    modifiedDate?: Date;
}

export type RecruiterActivityAccessDocument = RecruiterActivityAccess & Document;

export const RecruiterActivityAccessSchema = SchemaFactory.createForClass(RecruiterActivityAccess);