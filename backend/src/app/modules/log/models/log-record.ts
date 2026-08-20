
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IBaseModel } from "../../base/models/base";
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { ObjectId } from 'bson';

export enum LogLevel {
    DEBUG = "DEBUG",
    INFO = "INFO",
    ERROR = "ERROR",
    WARNING = "WARNING",
    CRITICAL = "CRITICAL"
}

export interface ILogRecord {
    source: string;
    logLevel: LogLevel;
    logData: string;
    additionalInfo?: string;
}

@Schema({ collection: 'log-records' })
@Entity("log-records")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.OwnerModel, INTERFACES.SharedModel)
export class LogRecord implements ILogRecord, IBaseModel, IAuditCreated {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    // [className:methodName]
    @Column()
    @Prop({ required: true })
    source: string;

    @Column()
    @Prop({ required: true })
    logLevel: LogLevel;

    @Column()
    @Prop({ required: true })
    logData: string;

    @Column()
    @Prop({ required: false })
    additionalInfo?: string;

    @Column()
    @Prop({ required: false })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: Date.now() })
    createdDate: Date = new Date();
}

export type LogRecordDocument = LogRecord & Document;
export const LogRecordSchema = SchemaFactory.createForClass(LogRecord);

