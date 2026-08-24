import { Injectable } from '@angular/core';
import { CVDataTemplate } from '../models/cv-data-template';
import { CandidateUserProfile, CompensationExpectations, LocationResidence } from '../../expertise/models/candidate-user-profile';
import { AcademicEducationLevelType, IntensityLevel, LanguageSkillType, ManagerialLevel, ProficiencyLevel, SkillType } from '../../skills/models/skill';
import { CompanyVersion } from '../../companies/models/company';

@Injectable({
  providedIn: 'root'
})
export class CvDataTemplateService {

  constructor() { }

  getLanguageLevel(level: number): string {
    const levels = ['A0', 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    return levels[level] || 'Unknown';
  }

  getDefaultData(): CandidateUserProfile {
    const defaultTemplateData: CandidateUserProfile = {
      userId: null,
      isPublic: true,
      pseudonym: "Alexandra Johnson (Pseudonym)",
      targetPosition: 'Senior Product Manager',
      user: {
        _id: '',
        firstname: 'Alexandra',
        lastname: 'Johnson',
        fullName: 'Alexandra Johnson',
        email: 'alexandra.johnson@email.com',
        phone: '+1 (555) 123-4567',
        photo: '/assets/cv-templates/executive-professional.jpg',
        createdDate: new Date(),
      },
      preferences: {
        compensationPackage: new CompensationExpectations(),
        motivationalFactors: [
          {
            factor: 'Building products that solve real user problems',
            influenceStrength: IntensityLevel.Normal,
            createdDate: new Date(),
            modifiedDate: new Date(),
            isVerified: true,
            _id: '',
          },
          {
            factor: 'Leading and mentoring high-performing teams',
            influenceStrength: IntensityLevel.Normal,
            createdDate: new Date(),
            modifiedDate: new Date(),
            isVerified: true,
            _id: '',
          },
          {
            factor: 'Continuous learning and professional growth',
            influenceStrength: IntensityLevel.Normal,
            createdDate: new Date(),
            modifiedDate: new Date(),
            isVerified: true,
            _id: '',
          },
          {
            factor: 'Data-driven innovation',
            influenceStrength: IntensityLevel.Normal,
            createdDate: new Date(),
            modifiedDate: new Date(),
            isVerified: true,
            _id: '',
          },
          {
            factor: 'Creating positive user experiences',
            influenceStrength: IntensityLevel.Normal,
            createdDate: new Date(),
            modifiedDate: new Date(),
            isVerified: true,
            _id: '',
          }
        ],
        onlyRemote: false
      },
      locationResidence: new LocationResidence(),
      userSocialMediaList: [],

      objective: "Dynamic product manager with 8+ years of experience leading cross-functional teams to deliver innovative solutions. Seeking to leverage expertise in agile methodologies and strategic planning to drive product excellence.",
      summary: "Results-driven professional with a proven track record of launching successful products and leading high-performing teams. Expertise in strategic planning, stakeholder management, and data-driven decision making.",

      skills: [],

      hardSkills: [
        {
          skillName: 'Product Strategy',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Expert,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'Agile/Scrum',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Professional,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'Data Analysis',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Regular,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'SQL',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Junior,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'JIRA',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Expert,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'Figma',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Professional,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'A/B Testing',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Lead,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
        {
          skillName: 'Market Research',
          skillType: SkillType.hard,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: ProficiencyLevel.Professional,
          startMonth: new Date(),
          isVerified: true,
          subGroups: []
        },
      ],
      softSkills: [
        {
          skillName: 'Leadership',
          skillType: SkillType.soft,
          isVerified: true,
          intensityEstimation: IntensityLevel.Normal
        },
        {
          skillName: 'Communication',
          skillType: SkillType.soft,
          isVerified: true,
          intensityEstimation: IntensityLevel.Normal
        },
        {
          skillName: 'Problem Solving',
          skillType: SkillType.soft,
          isVerified: true,
          intensityEstimation: IntensityLevel.Normal
        },
        {
          skillName: 'Critical Thinking',
          skillType: SkillType.soft,
          isVerified: true,
          intensityEstimation: IntensityLevel.Normal
        },
        {
          skillName: 'Collaboration',
          skillType: SkillType.soft,
          isVerified: true,
          intensityEstimation: IntensityLevel.Normal
        },
        {
          skillName: 'Adaptability',
          skillType: SkillType.soft,
          isVerified: true,
          intensityEstimation: IntensityLevel.Normal
        },
      ],
      managerialSkills: [
        {
          skillName: 'Team Leadership',
          skillType: SkillType.managirial,
          isVerified: true,
          level: ManagerialLevel.Lead
        },
        {
          skillName: 'Strategic Planning',
          skillType: SkillType.managirial,
          isVerified: true,
          level: ManagerialLevel.Lead
        },
        {
          skillName: 'Stakeholder Management',
          skillType: SkillType.managirial,
          isVerified: true,
          level: ManagerialLevel.Lead
        },
        {
          skillName: 'Budget Management',
          skillType: SkillType.managirial,
          isVerified: true,
          level: ManagerialLevel.Lead
        },
        {
          skillName: 'Performance Reviews',
          skillType: SkillType.managirial,
          isVerified: true,
          level: ManagerialLevel.Lead
        },
        {
          skillName: 'Conflict Resolution',
          skillType: SkillType.managirial,
          isVerified: true,
          level: ManagerialLevel.Lead
        },
      ],
      domainSkills: [
        {
          skillName: 'SaaS Products',
          skillType: SkillType.domain,
          isVerified: true,
          expirienceInMonths: 24,
          expirienceInYears: 2,
          proficiencyEstimation: 4,
        },
        {
          skillName: 'E-commerce',
          skillType: SkillType.domain,
          isVerified: true,
          expirienceInMonths: 36,
          expirienceInYears: 3,
          proficiencyEstimation: 6,
        },
        {
          skillName: 'Mobile Applications',
          skillType: SkillType.domain,
          isVerified: true,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: 3,
        },
        {
          skillName: 'User Experience',
          skillType: SkillType.domain,
          isVerified: true,
          expirienceInMonths: 60,
          expirienceInYears: 5,
          proficiencyEstimation: 6,
        },
        {
          skillName: 'Product Analytics',
          skillType: SkillType.domain,
          isVerified: true,
          expirienceInMonths: 60,
          expirienceInYears: 5,
          proficiencyEstimation: 5,
        },
        {
          skillName: 'Customer Journey Mapping',
          skillType: SkillType.domain,
          isVerified: true,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: 4,
        },
      ],
      languagesSkills: [
        {
          skillName: 'English',
          skillType: SkillType.language,
          languageSkillType: LanguageSkillType.general,
          isVerified: true,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: 6,
        },
        {
          skillName: 'Spanish',
          skillType: SkillType.language,
          languageSkillType: LanguageSkillType.general,
          isVerified: true,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: 5,
        },
        {
          skillName: 'French',
          skillType: SkillType.language,
          languageSkillType: LanguageSkillType.general,
          isVerified: true,
          expirienceInMonths: 12,
          expirienceInYears: 1,
          proficiencyEstimation: 4,
        },
      ],

      operationalExperience: [
        {
          companyId: null,
          companyName: 'TechCorp Inc.',
          company: new CompanyVersion(),
          workExpirienceName: '',
          achievements: [
            "Increased user engagement by 45% through data-driven feature prioritization",
            "Led cross-functional team of 12 to launch 3 major product releases",
            "Reduced customer churn by 30% through improved onboarding experience",
          ],
          startWorkDate: new Date(2021, 0, 1),
          endWorkDate: new Date(),
          additionalInfo: '',
          jobTitle: 'Senior Product Manager',
          resposiblities: [
            "Leading product strategy and development for enterprise SaaS platform serving 10,000+ customers."
          ],
          skillType: SkillType.operationalExperience,
          skillName: '',
          isVerified: true,
          skills: []
        },
        {
          companyId: null,
          companyName: 'StartupXYZ',
          company: new CompanyVersion(),
          workExpirienceName: '',
          achievements: [
            "Launched MVP in 6 months, achieving product-market fit",
            "Grew user base from 0 to 500K in 18 months",
            "Implemented analytics framework that improved decision-making speed by 60%",
          ],
          startWorkDate: new Date(2018, 0, 1),
          endWorkDate: new Date(2021, 0, 1),
          additionalInfo: '',
          jobTitle: 'Product Manager',
          resposiblities: [
            "Managed product lifecycle for mobile application with 500K+ active users."
          ],
          skillType: SkillType.operationalExperience,
          skillName: '',
          isVerified: true,
          skills: []
        },
        {
          companyId: null,
          companyName: 'Digital Solutions Ltd.',
          company: new CompanyVersion(),
          workExpirienceName: '',
          achievements: [
            "Contributed to 15% increase in conversion rates through UX improvements",
            "Managed stakeholder communications for 5+ concurrent projects",
          ],
          startWorkDate: new Date(2016, 0, 1),
          endWorkDate: new Date(2018, 0, 1),
          additionalInfo: '',
          jobTitle: 'Associate Product Manager',
          resposiblities: [
            "Supported senior product managers in developing e-commerce solutions."
          ],
          skillType: SkillType.operationalExperience,
          skillName: '',
          isVerified: true,
          skills: []
        }
      ],
      academicEducation: [
        {
          specialication: 'Business Administration',
          certificateNumber: '',
          currentlyStudying: false,
          startStudyDate: new Date(2015, 9, 1),
          fieldOfStudy: 'Focus on Technology Management and Innovation',
          graduationDate: new Date(2018, 5, 1),
          skillType: SkillType.academic,
          skillName: '',
          institutionName: 'Stanford Graduate School of Business',
          academicEducationLevelType: AcademicEducationLevelType.MBA,
          isVerified: true,
          institution: {
            _id: '',
            internationalName: 'Stanford Graduate School of Business',
            name: '',
            country: '',
            domains: [],
            createdDate: new Date(),
            web_pages: [],
            alpha_two_code: [],
            stateProvince: '',
            isVerified: true,
          },
        },
        {
          specialication: 'Computer Science',
          certificateNumber: '',
          currentlyStudying: false,
          startStudyDate: new Date(2011, 9, 1),
          fieldOfStudy: 'Minor in Business Administration',
          graduationDate: new Date(2015, 5, 1),
          skillType: SkillType.academic,
          skillName: '',
          institutionName: 'University of California, Berkeley',
          academicEducationLevelType: AcademicEducationLevelType.BSc,
          isVerified: true,
          institution: {
            _id: '',
            internationalName: 'University of California, Berkeley',
            name: '',
            country: '',
            domains: [],
            createdDate: new Date(),
            web_pages: [],
            alpha_two_code: [],
            stateProvince: '',
            isVerified: true,
          },
        }
      ],
      certification: [
        {
          skillName: 'Certified Scrum Product Owner (CSPO)',
          skillType: SkillType.certification,
          description: '',
          certificateNumber: '',
          certificationCenter: 'Scrum Alliance',
          certificationDate: new Date(2023, 1, 1),
          isVerified: true
        },
        {
          skillName: 'Product Management Certificate',
          skillType: SkillType.certification,
          description: '',
          certificateNumber: '',
          certificationCenter: 'Product School',
          certificationDate: new Date(2022, 4, 1),
          isVerified: true
        },
        {
          skillName: 'Google Analytics Certification',
          skillType: SkillType.certification,
          description: '',
          certificateNumber: '',
          certificationCenter: 'Google',
          certificationDate: new Date(2021, 8, 1),
          isVerified: true
        }
      ],

      additionalInformation: '',

      hobbies: [],
      coverLetters: [],
    }
    return defaultTemplateData;
  }
}
