import { Prop } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, PrimaryGeneratedColumn } from "typeorm";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";

export abstract class Brief implements IBaseModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: false })
    title?: string = '';

    @Column()
    @Prop({ required: false })
    description?: string = '';

    @Column()
    @Prop({ required: true })
    isIncluded: boolean = true;

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
