import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ObjectId } from 'bson';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { Implements, INTERFACES } from '../../../decorators/interfaces.decorator';
import { IAuditCreated, IAuditModified, IBaseModel, IOwnerModel, ISharedReadModel } from '../../base/models/base';
import { Skill, UserAcademicEducation, UserCertification, UserDomainSkill, UserHardSkill, UserLanguageSkill, UserManagerialSkill, UserOperationalExpirience, UserSoftSkill } from '../../skills/models/skill';
import { UserSocialMedia } from '../../social-media/models/user-social-media';
import { User } from '../../users/models/user';
import { Preferences } from './prefeences';
import { CommunicationMean } from '../../briefs/models/lead';
import { DEFAULT_NOTIFICATION_PREFERENCES, MessageNotificationPreferences } from '../../communication/enums/communication-means.enum';

@Schema({ collection: 'talent-profile' })
@Entity("talent-profile")
@Implements(INTERFACES.BaseModel, INTERFACES.Verifiable, INTERFACES.AuditCreated, INTERFACES.AuditModified, INTERFACES.OwnerModel)
export class TalentProfile implements IBaseModel, IAuditCreated, IAuditModified, IOwnerModel, ISharedReadModel {

    @Column()
    @PrimaryGeneratedColumn()
    _id?: ObjectId;

    @Column()
    @Prop({ required: true })
    userId: ObjectId;

    @Column()
    @Prop({ required: true })
    user: User = new User();

    @Column()
    @Prop({ required: false, default: false })
    isPublic?: boolean = false;

    @Column()
    @Prop({ required: false })
    pseudonym?: string = '';

    @Column()
    @Prop({ required: false })
    targetPosition?: string;

    @Column()
    @Prop({ required: false })
    preferences: Preferences = new Preferences();

    @Column()
    @Prop({ required: false, default: [] })
    userSocialMediaList: UserSocialMedia[] = [];

    @Column()
    @Prop({ required: false, default: "" })
    objective: string = '';

    @Column()
    @Prop({ required: false, default: "" })
    summary: string = '';

    @Column()
    @Prop({ required: false, default: [] })
    skills: Skill[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    hardSkills: UserHardSkill[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    softSkills: UserSoftSkill[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    domainSkills: UserDomainSkill[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    managerialSkills: UserManagerialSkill[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    languagesSkills: UserLanguageSkill[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    operationalExperience: UserOperationalExpirience[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    academicEducation: UserAcademicEducation[] = [];

    @Column()
    @Prop({ required: false, default: [] })
    certification: UserCertification[] = [];

    @Column()
    @Prop({ required: false, default: "" })
    additionalInformation: string = '';

    @Column()
    @Prop({ required: false, default: [] })
    hobbies: string[] = [];

    @Column()
    @Prop({ required: true })
    sharedReadIds: ObjectId[];

    @Column()
    @Prop({ required: true })
    sharedReadEmails: string[];

    @Column()
    @Prop({ required: true })
    createdBy: ObjectId;

    @Column()
    @Prop({ required: true, default: new Date(Date.now()) })
    createdDate: Date = new Date();

    @Column()
    @Prop({ required: false })
    modifiedBy?: ObjectId;

    @Column()
    @Prop({ required: false })
    modifiedDate: Date;
}

export const TalentProfileSchema = SchemaFactory.createForClass(TalentProfile);

export type TalentProfileDocument = TalentProfile & Document;
