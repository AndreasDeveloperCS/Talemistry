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

export interface IndustryArtifact extends Artifact {
    industryName: string;
    subgroups?: string[];
}

@Schema({ collection: 'industry-domains' })
@Entity("industry-domains")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class IndustryDomain implements IndustryArtifact, IBaseModel, IVerifiableModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    industryName: string = '';

    @Column()
    @Prop({ required: false })
    subgroups?: string[] = [];

    @Prop({ required: false, default: [] })
    parent?: IndustryArtifact[];

    @Column()
    @Prop({ required: false, default: [] })
    children?: IndustryArtifact[];

    @Prop({ required: false, default: [] })
    relating?: IndustryArtifact[];

    @Column()
    @Prop({ required: false, default: true })
    isVerified: boolean = true;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: new Date(Date.now()) })
    modifiedDate?: Date = new Date();
}

export type IndustryDomainDocument = IndustryDomain & Document;

export const IndustryDomainSchema = SchemaFactory.createForClass(IndustryDomain);