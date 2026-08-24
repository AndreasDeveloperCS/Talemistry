import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from "../../base/models/base";
import { QuestionType } from "./screening-question";

export enum QuestionCategory {
  Motivation = 'motivation',
  Communication = 'communication',
  CultureFit = 'culture_fit',
  ProblemSolving = 'problem_solving',
  Technical = 'technical',
  Leadership = 'leadership',
}

export enum PositionTag {
  General = 'general',
  Frontend = 'frontend',
  Backend = 'backend',
  Fullstack = 'fullstack',
  Designer = 'designer',
  QA = 'qa',
  Manager = 'manager',
  DevOps = 'devops',
  Mobile = 'mobile',
}

export enum SeniorityLevel {
  Junior = 'junior',
  Middle = 'middle',
  Senior = 'senior',
  Lead = 'lead',
}

@Schema({ collection: 'screening-question-templates' })
@Entity("screening-question-templates")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class ScreeningQuestionTemplate implements IBaseModel, IVerifiableModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true, unique: true })
    text: string = '';

    @Column()
    @Prop({ required: true, enum: Object.values(QuestionType), default: QuestionType.VideoResponse })
    type: QuestionType;

    @Column()
    @Prop({ required: true, default: true })
    required: boolean = true;

    @Column()
    @Prop({ required: false })
    durationInSeconds?: number;

    @Column()
    @Prop({ type: [String], enum: Object.values(PositionTag), index: true })
    positionTags: PositionTag[];

    @Column()
    @Prop({ type: [String], enum: Object.values(SeniorityLevel) })
    seniorityLevels: SeniorityLevel[];

    @Column()
    @Prop({ enum: Object.values(QuestionCategory) })
    category: QuestionCategory;

    @Column()
    @Prop({ required: true, default: 0 })
    usageCount: number;

    @Column()
    @Prop({ required: true, default: true })
    isVerified: boolean = true;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: () => new Date() })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false, default: () => new Date() })
    modifiedDate?: Date;
}

export type ScreeningQuestionTemplateDocument = ScreeningQuestionTemplate & Document;

export const ScreeningQuestionTemplateSchema = SchemaFactory.createForClass(ScreeningQuestionTemplate);