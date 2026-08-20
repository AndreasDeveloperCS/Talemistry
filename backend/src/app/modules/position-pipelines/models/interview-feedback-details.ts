import { ObjectId } from 'bson';
import { Column, Entity, ObjectIdColumn, PrimaryGeneratedColumn } from 'typeorm';
import { Skill } from '../../skills/models/skill';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IBaseModel } from '../../base/models/base';

@Entity('recommendation-links')
export class RecommendationLinks {
    @ObjectIdColumn()
    id: ObjectId;
    recommendation: string;
    links: string;
}

@Entity('feedback-items')
export class FeedbackItem {
    @ObjectIdColumn()
    id: ObjectId;

    @Column()
    skill: Skill;

    feedback: string;

    recommendation: string;

    links: RecommendationLinks[];
}

@Schema({ collection: 'interview-feedback-details' })
@Entity('interview-feedback-details')
@Implements(INTERFACES.BaseModel)
export class InterviewFeedbackDetails implements IBaseModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    stageId: ObjectId;

    @Column()
    @Prop({ required: true })
    feedbackCollection: FeedbackItem[];
}

export const InterviewFeedbackDetailsSchema = SchemaFactory.createForClass(InterviewFeedbackDetails);

export type InterviewFeedbackDetailsDocument = InterviewFeedbackDetails & Document;