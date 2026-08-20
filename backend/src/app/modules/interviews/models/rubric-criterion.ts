import { Prop } from "@nestjs/mongoose";
import { Column } from "typeorm";


export class RubricCriterion {
    @Column()
    @Prop({ required: true })
    key: string; // e.g., "SystemDesign"

    @Column()
    @Prop({ required: true })
    label: string;

    @Column()
    @Prop({ required: false })
    weight?: number; // 0..1
}
