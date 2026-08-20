import { ObjectId } from "bson";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";


@Schema({ collection: 'schedule-timeframes' })
@Entity("schedule-timeframes")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class ScheduleTimeFrame implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    // @Column()
    // @Prop({ required: true })
    // availabelTimeFrames: AvailabilityTimeFrame[];
    @Column()
    @Prop({ required: true })
    startDate: Date;

    @Column()
    @Prop({ required: true })
    startTime: Date;

    @Column()
    @Prop({ required: true })
    endTime: Date;


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
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate?: Date;
}



export type ScheduleTimeFrameDocument = ScheduleTimeFrame & Document;

export const ScheduleTimeFrameSchema = SchemaFactory.createForClass(ScheduleTimeFrame);