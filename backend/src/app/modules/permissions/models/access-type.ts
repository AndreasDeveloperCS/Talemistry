import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";

export type AccessTypeDocument = AccessType & Document;

export enum RestMethods {
    GET = 'GET',
    POST = 'POST',
    PUT = 'PUT',
    PATCH = 'PATCH',
    DELETE = 'DELETE',
}

@Schema({ collection: 'access-type' })
@Entity("access-type")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class AccessType implements IBaseModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    code: string = '';

    @Column()
    @Prop({ required: true })
    description: string = '';

    @Column()
    @Prop({ required: true })
    methods: RestMethods[] = [];

    @Column()
    @Prop({ required: true, default: true })
    isActive: boolean = true;

    @Column()
    @Prop({ required: true, default: false })
    bit: boolean = false; // ?

    @Column()
    @Prop({ required: true })
    registerValue: number = 0;

    @Column()
    @Prop({ required: true })
    bitValue: number;

    @Column()
    @Prop({ required: true })
    numberValue: number;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: Date.now() })
    createdDate: Date;

    @Column()
    @Prop({ required: false, default: Date.now() })
    modifiedDate: Date;
}

export const AccessTypeSchema = SchemaFactory.createForClass(AccessType);