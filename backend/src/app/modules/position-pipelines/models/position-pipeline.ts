import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from '../../base/models/base';
import { PipelineStage } from './pipeline-stage';

@Schema({ collection: 'position-pipelines' })
@Entity('position-pipelines')
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel, INTERFACES.AuditModified)
export class PositionPipeline implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: true })
    stages: PipelineStage[] | ObjectId[];

    @Column()
    @Prop({ required: true, type: ObjectId })
    userId: ObjectId;

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

export const PositionPipelineSchema = SchemaFactory.createForClass(PositionPipeline);

export type PositionPipelineDocument = PositionPipeline & Document;