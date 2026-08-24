import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { EmploymentType, ExperienceLevel, RequisitionReason } from "./workable-enums";

export class Code {
  @Column()
  @Prop({ required: true })
  value: string;
}

@Schema({ collection: "workable-requisition" })
@Entity("workable-requisition")
export class WorkableRequisition {
  
    @PrimaryGeneratedColumn()
    _id?: string;

    @Column()
    @Prop({ required: true })
    code: Code;

    @Column()
    @Prop({ required: true })
    owner_id: string;

    @Column()
    @Prop({ required: true })
    member_id: string;

    @Column()
    @Prop({ required: true })
    hiring_manager_id: string;

    @Column()
    @Prop({ required: false })
    job_id?: string;

    @Column()
    @Prop({ required: true })
    job_title: string;

    @Column()
    @Prop({ required: false })
    department_id?: string;

    @Column()
    @Prop({ required: false })
    country_code?: string;

    @Column()
    @Prop({ required: false })
    state_code?: string;

    @Column()
    @Prop({ required: false })
    city?: string;

    @Column()
    @Prop({ required: false })
    subregion?: string;

    @Column()
    @Prop({ required: false })
    coords?: string;

    @Column()
    @Prop({ required: false })
    location_string?: string;

    @Column({ type: "enum", enum: EmploymentType, nullable: true })
    @Prop({ required: false })
    employment_type?: EmploymentType;

    @Column({ type: "enum", enum: ExperienceLevel, nullable: true })
    @Prop({ required: false })
    experience?: ExperienceLevel;

    @Column()
    @Prop({ required: false })
    salary_from?: string;

    @Column()
    @Prop({ required: false })
    salary_to?: string;

    @Column()
    @Prop({ required: false })
    salary_currency?: string;

    @Column()
    @Prop({ required: false })
    salary_frequency?: string;

    @Column({ type: "enum", enum: RequisitionReason, nullable: true })
    @Prop({ required: false })
    reason?: RequisitionReason;

    @Column()
    @Prop({ required: false })
    notes?: string;

    @Column()
    @Prop({ required: true })
    plan_date: string;

    @Column()
    @Prop({ required: false })
    custom_attr_slug?: string;

    @Column()
    @Prop({ required: false, default: true })
    isVerified?: boolean;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    dateTimeAdded?: Date = new Date();

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    dateTimeModified?: Date = new Date();
}

  export const WorkableRequisitionSchema = SchemaFactory.createForClass(WorkableRequisition);
  
  export type WorkableRequisitionDocument = WorkableRequisition & Document;