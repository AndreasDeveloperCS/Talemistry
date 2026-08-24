import { Prop, Schema } from "@nestjs/mongoose";
import { Certification, Skill, SkillSchema, UserAcademicEducation, UserOperationalExpirience, UserOperationalExpirienceSchema } from "../../skills/models/skill";
import { Education, EducationSchema } from "../../skills/models/education";
import { CertificationSchema } from "../../skills/models/certification";

@Schema()
export class CandidateProfile {
    @Prop() userId: string;
    @Prop() summary: string;
    @Prop() objective: string;

    @Prop({ type: [SkillSchema] }) hardSkills: Skill[];
    @Prop({ type: [SkillSchema] }) softSkills: Skill[];
    @Prop({ type: [SkillSchema] }) domainSkills: Skill[];
    @Prop({ type: [SkillSchema] }) managerialSkills: Skill[];
    @Prop({ type: [SkillSchema] }) languagesSkills: Skill[];
    @Prop({ type: [UserOperationalExpirienceSchema] }) operationalExperience: UserOperationalExpirience[];
    @Prop({ type: [EducationSchema] }) academicEducation: UserAcademicEducation[];
    @Prop({ type: [CertificationSchema] }) certification: Certification[];

    @Prop() preferences: any;
    @Prop() additionalInformation: string;
    @Prop() isPublic: boolean;
}