import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { SessionStatus } from './session-status.enum';
import { ROLES } from '../../../common/enums';
import { ProgrammingLanguage } from './programming-language.enum';

export interface LiveCodingSessionParticipant {
  userId: string;
  role: ROLES.TALENT | ROLES.HR | ROLES.HM | ROLES.RC;
  name?: string;
}

export interface CodeRunResult {
  output: string;
  error?: string;
  success: boolean;
  executedAt: Date;
}

export interface CodeSnapshot {
  code: string;
  createdDate: Date;
}

@Schema({ collection: 'live_coding_sessions' })
@Entity("live_coding_sessions")
@Implements(INTERFACES.BaseModel, INTERFACES.OwnerModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class LiveCodingSession implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true, enum: SessionStatus, default: SessionStatus.SCHEDULED })
    status: SessionStatus;

    @Column()
    @Prop({ required: true, default: [] })
    participants: LiveCodingSessionParticipant[];

    @Column()
    @Prop({ required: true, enum: ProgrammingLanguage, default: ProgrammingLanguage.JAVASCRIPT })
    language: ProgrammingLanguage;

    @Column()
    @Prop({ required: false })
    taskId?: ObjectId;

    @Column()
    @Prop({ required: false })
    currentCode?: string;

    @Column()
    @Prop({ required: false })
    finalCode?: string;

    @Column()
    @Prop({
        required: false,
        type: [
        {
            code: String,
            createdAt: Date,
        },
        ],
        default: [],
    })
    snapshots: CodeSnapshot[];

    @Column()
    @Prop({ required: false })
    startedAt?: Date;

    @Column()
    @Prop({ required: false })
    finishedAt?: Date;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: false  })
    createdDate: Date;

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false })
    modifiedDate: Date;
}

export type LiveCodingSessionDocument = LiveCodingSession & Document;

export const LiveCodingSessionSchema = SchemaFactory.createForClass(LiveCodingSession);