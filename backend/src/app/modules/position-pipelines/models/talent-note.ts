import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedModel } from '../../base/models/base';

export enum TalentNoteVisibility {
  PRIVATE = 'private',
  TEAM = 'team',
}

@Schema({ collection: 'talent-notes' })
@Entity('talent-notes')
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.OwnerModel, INTERFACES.SharedModel, INTERFACES.AuditModified)
export class TalentNote implements IBaseModel, IOwnerModel, IAuditCreated, ISharedModel, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id: ObjectId;

    @Column()
    @Prop({ required: true })
    talentId: ObjectId;

    @Column()
    @Prop({ required: true })
    positionId: ObjectId;

    @Column()
    @Prop({ required: false })
    stageId?: ObjectId;

    @Column()
    @Prop({ required: true })
    text: string;

    @Column()
    @Prop({ required: false, default: TalentNoteVisibility.PRIVATE })
    visibility: TalentNoteVisibility;

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

export const TalentNoteSchema = SchemaFactory.createForClass(TalentNote);

export type TalentNoteDocument = TalentNote & Document;