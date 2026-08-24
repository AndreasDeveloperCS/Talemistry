import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export class Salary {
    @Column()
    @Prop({ required: true })
    from: number;

    @Column()
    @Prop({ required: false })
    to?: number;

    @Column()
    @Prop({ required: true })
    currency: string;

    @Column()
    @Prop({ required: true })
    frequency: "HOURLY" | "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";

    @Column()
    @Prop({ required: false })
    isShownOnJobAd?: boolean;
}

export class Contact {
    @Column()
    @Prop({ required: true })
    name: string;

    @Column()
    @Prop({ required: true })
    email: string;

    @Column()
    @Prop({ required: false })
    position?: string;
}

export class ScreeningQuestion {
    @Column()
    @Prop({ required: true })
    name: string;

    @Column()
    @Prop({ required: true })
    type: "TEXT";

    @Column({ type: "simple-array", nullable: true })
    @Prop({ required: false })
    options?: string[];

    @Column()
    @Prop({ required: true })
    required: boolean;
}

export class HiringTeamMember {
    @Column()
    @Prop({ required: true })
    hiringTeamMember: string;

    @Column()
    @Prop({ required: true })
    jobRole: "admin";
}

@Schema({ collection: "join-jobs" })
@Entity("join-jobs")
export class JoinJob {
  
    @PrimaryGeneratedColumn()
    _id?: string;

    @Column()
    @Prop({ required: false })
    externalId?: string;

    @Column()
    @Prop({ required: true })
    title: string;

    @Column({ type: "text" })
    @Prop({ required: true })
    description: string;

    @Column()
    @Prop({ required: true })
    categoryId: number;

    @Column()
    @Prop({ required: true })
    language: string;

    @Column()
    @Prop({ required: true })
    officeId: number;

    @Column()
    @Prop({ required: true })
    employmentTypeId: number;

    @Column()
    @Prop({ required: false })
    seniorityId?: number;

    @Column()
    @Prop({ required: false })
    contactPerson?: string;

    @Column()
    @Prop({ required: false })
    workplaceType?: string;

    @Column()
    @Prop({ required: false })
    remoteType?: string;

    @Column()
    @Prop({ required: false })
    cv?: string;

    @Column()
    @Prop({ required: false })
    coverLetter?: string;

    @Column()
    @Prop({ required: false })
    status?: string;

    @Column({ type: "json", nullable: true })
    @Prop({ required: false })
    salary?: Salary;

    @Column({ type: "json", nullable: true })
    @Prop({ required: false })
    contact?: Contact;

    @Column({ type: "json", nullable: true })
    @Prop({ required: false })
    questions?: ScreeningQuestion[];

    @Column({ type: "json", nullable: true })
    @Prop({ required: false })
    hiringTeam?: HiringTeamMember[];

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    dateTimeAdded?: Date = new Date();

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    dateTimeModified?: Date = new Date();
}

export const JoinJobSchema = SchemaFactory.createForClass(JoinJob);
export type JoinJobDocument = JoinJob & Document;
