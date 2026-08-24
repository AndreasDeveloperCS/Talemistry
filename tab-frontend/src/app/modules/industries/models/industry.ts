import { BaseEntity } from "../../general/models/base-entity";

export interface Artifact {
    parent?: Artifact[];
    children?: Artifact[];
    relating?: Artifact[];
}

export interface IndustryArtifact extends Artifact {
    industryName: string;
}

export interface IndustrySubgroupArtifact extends Artifact {
    industrySubGroupName: string;
}

export class IndustrySubGroup implements BaseEntity {
    _id?: any;
    industrySubGroupName: string = '';

    subgroups?: string[] = [];

    parent?: IndustrySubgroupArtifact[];

    children?: IndustrySubgroupArtifact[];

    relating?: IndustrySubgroupArtifact[];

    isVerified: boolean = true;

    createdBy: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}

export class IndustryDomain implements BaseEntity {
    _id?: any;
    industryName: string = '';
    subgroups?: any[] = [];
    parent?: IndustryArtifact[];
    children?: IndustryArtifact[];
    relating?: IndustryArtifact[];


    isVerified: boolean = true;
    createdBy: any;
    createdDate: Date = new Date();
    modifiedBy?: any;
    modifiedDate?: Date;
}