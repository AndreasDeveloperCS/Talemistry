import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";

export class ActionItem {
    @Column()
    @Prop({ required: true })
    title: string;

    @Column()
    @Prop({ required: false })
    ownerEmail?: string;

    @Column()
    @Prop({ required: false })
    dueDate?: Date;

    @Column()
    @Prop({ required: false })
    notes?: string;

    @Column()
    @Prop({ required: false })
    completed?: boolean;
}