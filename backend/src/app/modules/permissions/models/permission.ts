import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IBaseModel } from "../../base/models/base";
import { FUNCTIONALBLOCK } from "./functional-block-enum";

export type PermissionDocument = Permission & Document;

@Schema({ collection: 'permissions' })
@Entity("permissions")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class Permission implements IBaseModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    roleId: ObjectId;

    @Column()
    @Prop({ required: true })
    roleCode: string;

    @Column()
    @Prop({ required: true })
    functionalBlockId: ObjectId;

    @Column()
    @Prop({ required: true })
    functionalBlockCode: FUNCTIONALBLOCK;

    @Column()
    @Prop({ required: true })
    registerQuantity: number = 0;

    @Column()
    @Prop({ required: true })
    bitMask: number;

    @Column()
    @Prop({ required: true })
    numberValue: number;

    @Column()
    @Prop({ required: true, default: true })
    isActive: boolean = true; // ??

    @Column()
    @Prop({ required: false })
    createdBy?: ObjectId;

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

export const PermissionSchema = SchemaFactory.createForClass(Permission);