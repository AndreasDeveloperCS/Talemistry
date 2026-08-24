import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Column, Entity } from "typeorm";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { Brief } from "./brief";
import { IBriefQuestion } from "./brief-question";
import { IBriefSectionTemplate } from "./brief-template-section";

@Schema({ collection: 'brief-templates' })
@Entity("brief-templates")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class BriefTemplate extends Brief {

    @Column()
    @Prop({ required: false, type: Array })
    sections?: IBriefSectionTemplate[];

    @Column()
    @Prop({ required: false, type: Array })
    questions?: IBriefQuestion[];
}

export const BriefTemplateSchema = SchemaFactory.createForClass(BriefTemplate);

export type BriefTemplateDocument = BriefTemplate & Document;