import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IVerifiableModel } from "../../base/models/base";

export interface Artifact {
    parent?: Artifact[];
    children?: Artifact[];
    relating?: Artifact[];
}

export interface IndustrySubgroupArtifact extends Artifact {
    industrySubGroupName: string;
    subgroups?: string[];
}

@Schema({ collection: 'industry-subgroups' })
@Entity("industry-subgroups")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class IndustrySubGroup implements IndustrySubgroupArtifact, IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    industrySubGroupName: string = '';

    @Column()
    @Prop({ required: false })
    subgroups?: string[] = [];

    @Prop({ required: false, default: [] })
    parent?: IndustrySubgroupArtifact[];

    @Column()
    @Prop({ required: false, default: [] })
    children?: IndustrySubgroupArtifact[];

    @Prop({ required: false, default: [] })
    relating?: IndustrySubgroupArtifact[];

    @Column()
    @Prop({ required: false, default: true })
    isVerified: boolean = true;

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

export type IndustrySubGroupDocument = IndustrySubGroup & Document;

export const IndustrySubGroupSchema = SchemaFactory.createForClass(IndustrySubGroup);