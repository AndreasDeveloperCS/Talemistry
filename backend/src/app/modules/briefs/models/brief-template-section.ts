import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Column, Entity } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { IBriefQuestion } from "./brief-question";
import { BriefSection, IBriefSection } from "./brief-section";

export interface IBriefSectionTemplate extends IBriefSection {
    sections?: IBriefQuestion[];
}

@Schema({ collection: 'brief-sections-template' })
@Entity("brief-sections-template")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class BriefSectionTemplate extends BriefSection implements IBriefSectionTemplate {

    @Column()
    @Prop({ required: false, type: Array })
    questions?: IBriefQuestion[];
}

export const BriefSectionTemplateSchema = SchemaFactory.createForClass(BriefSectionTemplate);

export type BriefSectionTemplateDocument = BriefSectionTemplate & Document;