import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IBaseModel } from "../../base/models/base";

export type RoleDocument = Role & Document;

@Schema({ collection: 'roles' })
@Entity("roles")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class Role implements IBaseModel {

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
    route: string = '';

    @Column()
    @Prop({ required: true, default: true })
    isActive: boolean = true;

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
    @Prop({ required: false })
    icon?: ObjectId;

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

export const RoleSchema = SchemaFactory.createForClass(Role);