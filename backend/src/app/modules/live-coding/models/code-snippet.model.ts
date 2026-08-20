import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel } from "../../base/models/base";
import { ProgrammingLanguage } from './programming-language.enum';

@Schema({ collection: 'code-snippets' })
@Entity("code-snippets")
@Implements(INTERFACES.BaseModel, INTERFACES.OwnerModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class CodeSnippet implements IBaseModel, IOwnerModel, IAuditCreated, IAuditModified {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    title: string;

    @Column()
    @Prop({ required: true })
    code: string;

    @Column()
    @Prop({ required: true, enum: ProgrammingLanguage, default: ProgrammingLanguage.JAVASCRIPT })
    language: ProgrammingLanguage;

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

export type CodeSnippetDocument = CodeSnippet & Document;

export const CodeSnippetSchema = SchemaFactory.createForClass(CodeSnippet);