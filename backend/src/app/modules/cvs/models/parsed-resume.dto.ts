export class ParsedResumeDto {
    name: string;
    surname: string;
    fullname: string;
    emails: string[];
    phones: string[];
    location?: string;
    links: { linkedin?: string; github?: string; portfolio?: string; others: string[] };
    skills: string[];
    experience: OperationalExperienceItem[];
    education: EducationItem[];
    certifications: string[];
    languages: string[];
    rawText: string;
}

export interface OperationalExperienceItem {
    title?: string;
    company?: string;
    location?: string;
    startDateS?: string; // ISO or raw "MMM YYYY"
    endDateS?: string;   // "Present" allowed
    startDate?: Date; // ISO or raw "MMM YYYY"
    endDate?: Date;   // "Present" allowed
    summary?: string;
    bullets?: string[];
    technologies?: string[]; // inferred skills in this role
}

export interface EducationItem {
    degree?: string;
    major?: string;
    school?: string;
    location?: string;
    startYear?: string;
    endYear?: string;
}

export interface ProjectItem {
    name?: string;
    role?: string;
    period?: string;
    startDateS?: string; // ISO or raw "MMM YYYY"
    endDateS?: string;   // "Present" allowed
    startDate?: Date; // ISO or raw "MMM YYYY"
    endDate?: Date;   // "Present" allowed
    bullets?: string[];
    technologies?: string[];
    link?: string;
}

export interface ParsedResumeDto {
    identity: {
        fullName?: string;
        headline?: string; // e.g., "Senior Full-Stack Engineer"
        location?: string;
    };
    contacts: {
        emails: string[];
        phones: string[];
    };
    links: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
        others: string[];
    };
    socialLinks: {
        linkedin?: string;
        github?: string;
        portfolio?: string;
        others: string[];
    };
    languages: string[];
    skills: string[]; // normalized/canonical skills
    experience: OperationalExperienceItem[];
    projects: ProjectItem[];
    education: EducationItem[];
    certifications: string[];
    meta: {
        rawText: string;
        pageCount?: number;
        parser: 'pdf-parse' | 'pdfjs-dist';
        needsManualReview?: boolean;
        sha256?: string;
        parseVersion: string;
    };
}