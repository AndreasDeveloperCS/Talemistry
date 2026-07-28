import { HydratedDocument } from 'mongoose';
export type AssessmentDocument = HydratedDocument<Assessment>;
export declare enum AssessmentKind {
    Skills = "skills",
    Psychometric = "psychometric",
    Culture = "culture",
    Cognitive = "cognitive"
}
export declare class Assessment {
    name: string;
    kind: AssessmentKind;
    duration: string;
    description: string;
    proctored: boolean;
    autoScored: boolean;
    assigned: number;
    completed: number;
    avgScore: number;
}
export declare const AssessmentSchema: import("mongoose").Schema<Assessment, import("mongoose").Model<Assessment, any, any, any, import("mongoose").Document<unknown, any, Assessment, any, {}> & Assessment & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, Assessment, import("mongoose").Document<unknown, {}, import("mongoose").FlatRecord<Assessment>, {}, import("mongoose").DefaultSchemaOptions> & import("mongoose").FlatRecord<Assessment> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
