import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { ObjectId } from "bson";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { QuestionType } from "./screening-question";

export class ScreeningSingleAnswer {
  questionId: ObjectId;
  questionText: string = '';   // snapshot for historical integrity
  questionType?: QuestionType;
  value: any;
  video?: ScreeningVideoAnswerInfo;
}

export class ScreeningVideoAnswerInfo {
  durationInSeconds?: number;
  videoSource?: string;
}

@Schema({ collection: 'screening-responses' })
@Entity("screening-responses")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class ScreeningResponse implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    formId: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: true })
    talentId: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    answers: ScreeningSingleAnswer[] = [];

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

export type ScreeningResponseDocument = ScreeningResponse & Document;

export const ScreeningResponseSchema = SchemaFactory.createForClass(ScreeningResponse);