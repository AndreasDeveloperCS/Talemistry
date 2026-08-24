import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, IVerifiableModel } from "../../base/models/base";

export enum QuestionType {
  Text = 'text',
  Textarea = 'textarea',
  Select = 'select',
  Multiselect = 'multiselect',
  VideoResponse = 'videoresponse',
}

export class QuestionOption {
  questionId: any;
  text: string = '';
  order: number = 0;
}

@Schema({ collection: 'screening-questions' })
@Entity("screening-questions")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class ScreeningQuestion implements IBaseModel, IVerifiableModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    text: string = '';

    @Column()
    @Prop({ required: true, enum: Object.values(QuestionType), default: QuestionType.Text })
    type: QuestionType;

    @Column()
    @Prop({ required: true, default: true })
    required: boolean = true;

    @Column()
    @Prop({ required: true })
    formId: ObjectId;

    @Column()
    @Prop({ required: false })
    durationInSeconds?: number;

    @Column()
    @Prop({ required: true })
    order: number = 0;

    @Column()
    @Prop({ required: true, default: [] })
    options: QuestionOption[];

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

export type ScreeningQuestionDocument = ScreeningQuestion & Document;

export const ScreeningQuestionSchema = SchemaFactory.createForClass(ScreeningQuestion);