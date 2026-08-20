import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import * as mongoose from 'mongoose';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel } from '../../base/models/base';
import { FeedbackSource, FeedbackStatus, StageFeedbackPayload } from '../types/pipeline.types';
import { StageType } from './pipeline-stage';

@Schema({ collection: 'pipeline-stage-feedbacks' })
@Entity('pipeline-stage-feedbacks')
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel, INTERFACES.SharedModel, INTERFACES.AuditModified)
export class PipelineStageFeedback implements IBaseModel, IOwnerModel, IAuditCreated, ISharedModel, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true, type: ObjectId })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: true })
    talentId: ObjectId;

    @Column()
    @Prop({ required: true })
    pipelineProgressId: ObjectId;

    @Column()
    @Prop({ required: true })
    stageId: ObjectId;

    @Column()
    @Prop({ required: true })
    stageType: StageType;

    @Column()
    @Prop({ required: true })
    source!: FeedbackSource;

    @Column()
    @Prop({ required: true })
    status!: FeedbackStatus;

    @Column()
    @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
    payload!: StageFeedbackPayload;

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
    
    @Column()
    @Prop({ required: false })
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: false })
    sharedReadEmails: string[];

    @Column()
    @Prop({ required: false })
    sharedEditIds: ObjectId[];

    @Column()
    @Prop({ required: false })
    sharedEditEmails: string[];
}

export const PipelineStageFeedbackSchema = SchemaFactory.createForClass(PipelineStageFeedback);

export type PipelineStageFeedbackDocument = PipelineStageFeedback & Document;