import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IBaseModel } from "../../base/models/base";

export type FunctionalBlockDocument = FunctionalBlock & Document;

@Schema({ collection: 'functional-blocks' })
@Entity("functional-blocks")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class FunctionalBlock implements IBaseModel {

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
    endpointRoute: string = '';

    @Column()
    @Prop({ required: true, default: true })
    isActive: boolean = true;

    // @Column()
    // @Prop({ required: true, default: true })
    // isPublic: boolean = false;

    // @Column()
    // @Prop({ required: true, default: true })
    // requiresAuthentication: boolean = true;

    @Column()
    @Prop({ required: true })
    registerValue: number = 0;

    @Column()
    @Prop({ required: true, type: String, default: '0' })
    bitValue: string;

    @Column()
    @Prop({ required: true })
    numberValue: number;

    @Column()
    @Prop({ required: false, default: false })
    isPublic: boolean = false;

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

export const FunctionalBlockSchema = SchemaFactory.createForClass(FunctionalBlock);