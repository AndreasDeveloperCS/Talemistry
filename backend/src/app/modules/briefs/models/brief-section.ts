import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";
import { ObjectId } from "bson";

export interface IBriefSection extends IBaseModel {
    title: string;
    description: string;
    isIncluded: boolean;
    dependentOn?: ObjectId;
    orderId: number;
}


export abstract class BriefSection implements IBaseModel, IBriefSection, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    title: string;

    @Column()
    @Prop({ required: true })
    description: string;

    @Column()
    @Prop({ required: true, default: true })
    isIncluded: boolean = true;

    @Column()
    @Prop({ required: true })
    orderId: number;

    @Column()
    @Prop({ required: false })
    dependentOn?: ObjectId;

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



