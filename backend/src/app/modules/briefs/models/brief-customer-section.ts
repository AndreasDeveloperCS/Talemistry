import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IBriefCustomerQuestion } from "./brief-question";
import { Implements, INTERFACES } from "../../../decorators/interfaces.decorator";
import { Column, Entity } from "typeorm";
import { BriefSection, IBriefSection } from "./brief-section";
import { IAuditCreated, IAuditModified, IBaseModel } from "../../base/models/base";

export interface IBriefCustomerSection extends IBriefSection {
    sections?: IBriefCustomerQuestion[];
}

@Schema({ collection: 'brief-customer-sections' })
@Entity("brief-customer-sections")
@Implements(INTERFACES.BaseModel, INTERFACES.AuditCreated, INTERFACES.AuditModified)
export class BriefCustomerSection extends BriefSection implements IBaseModel, IAuditCreated, IAuditModified {

    @Column()
    @Prop({ required: false, type: Array })
    questions?: IBriefCustomerQuestion[];

}

export const BriefCustomerSectionSchema = SchemaFactory.createForClass(BriefCustomerSection);

export type BriefCustomerSectionDocument = BriefCustomerSection & Document;