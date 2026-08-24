import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";
import { ObjectId } from "bson";
import { IBriefSection } from "./brief-section";
import { FileInfo } from "../../cvs/models/file-info";

export enum QuestionTemplateType {
    Text = "Text",
    SigleSelect = "SigleSelect",
    MultiSelect = "MultiSelect",
    File = "File",
    FileCollection = "FileCollection",
    IncludeQuestion = "IncludeQuestion",
    IncludeSection = "IncludeSection"
}

export interface IBriefQuestion {
    // section?: IBriefSection;
    type: QuestionTemplateType;
    question: string;
    options?: IBriefQuestionOption[];
    // isIncluded: boolean;
    // orderId: number;
    // dependentOn?: ObjectId;
}

export enum DependencyType {
    Section = "Section",
    Question = "Question",
}

export interface IBriefQuestionOption {
    optionText: string;
    isSelected: boolean;
    dependencyFor?: [ObjectId];
    dependency?: DependencyType;
}

export interface IBriefCustomerQuestion extends IBriefQuestion {
    answer?: string | string[] | FileInfo | FileInfo[] | boolean | IBriefQuestionOption[];
}

@Schema({ collection: 'brief-questions' })
@Entity("brief-questions")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class BriefQuestion implements IBaseModel, IBriefQuestion, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    // @Column()
    // @Prop({ required: false, type: ObjectId, ref: 'BriefSection' })
    // section?: IBriefSection;

    @Column()
    @Prop({ required: true })
    question: string;

    @Column()
    @Prop({ required: true })
    type: QuestionTemplateType;

    @Column()
    @Prop({ required: false })
    options?: IBriefQuestionOption[] = [];

    // @Column()
    // @Prop({ required: true })
    // orderId: number;

    // @Column()
    // @Prop({ required: false })
    // dependentOn?: ObjectId;

    // @Column()
    // @Prop({ required: true, default: true })
    // isIncluded: boolean = true;

    // @Column()
    // @Prop({ required: false, type: ObjectId, ref: 'BriefSection' })
    // briefSection?: IBriefSection;

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

export const BriefQuestionSchema = SchemaFactory.createForClass(BriefQuestion);

export type BriefQuestionDocument = BriefQuestion & Document;