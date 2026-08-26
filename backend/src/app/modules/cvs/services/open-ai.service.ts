
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { encoding_for_model, get_encoding, TiktokenModel } from "tiktoken";
import { TalentProfile } from '../../profiles/models/talent-profile';

interface CodeSnippet {
  title: string;
  code: string;
  language: string;
}

export function countTokens(text: string, model: string = "gpt-5.4"): number {
    const modelT: TiktokenModel = model as TiktokenModel;
    const enc = encoding_for_model(modelT);
    const tokens = enc.encode(text);
    return tokens.length;
}
export function countTokens2(text: string, model: string = "gpt-4o-mini"): number {
    const enc = get_encoding("cl100k_base");
    const tokens = enc.encode(text);
    enc.free(); // optional cleanup
    return tokens.length;
}
function chunkTextByLength(text: string, maxLength = 40000) {
    const paragraphs = text.split(/\n\s*\n/);
    const chunks: string[] = [];
    let currentChunk = "";

    for (const p of paragraphs) {
        if ((currentChunk + p).length > maxLength) {
            chunks.push(currentChunk.trim());
            currentChunk = p + "\n\n";
        } else {
            currentChunk += p + "\n\n";
        }
    }

    if (currentChunk.trim()) {
        chunks.push(currentChunk.trim());
    }

    return chunks;
}

function splitCVIntoSections(cvText: string) {
    const sections: Record<string, string> = {};

    const regex = /(Summary|Objective|Profile|Commercial Experience|Operational Experience|Experience|Work Experience|Employment|Academic Education|Education|Skills|Certifications|Projects|Languages|Awards|Hobbies)[:\n]/gi;
    const parts = cvText.split(regex);

    for (let i = 0; i < parts.length; i++) {
        const key = parts[i]?.trim();
        const value = parts[i + 1]?.trim();
        if (regex.test(key)) {
            sections[key.toLowerCase()] = value;
            i++;
        }
    }

    return Object.keys(sections).length ? sections : { general: cvText };
}

@Injectable()
export class OpenAIHelperService {
    private MAX_TOKENS = 120000;
    private MODEL = "gpt-5";
    private openai?: OpenAI;
    private readonly logger = new Logger(OpenAIHelperService.name);

    private getOpenAI(): OpenAI {
        if (!this.openai) {
            const apiKey = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY2;
            if (!apiKey) {
                throw new Error('OpenAI is not configured. Set OPENAI_API_KEY before using AI features.');
            }
            this.openai = new OpenAI({ apiKey });
        }
        return this.openai;
    }

    async generateStructuredTalentProfileBySections(
        rawCvText: string
    ): Promise<TalentProfile> {
        try {
            const totalTokens = countTokens(rawCvText, this.MODEL);
            this.logger.log(`Total CV token length: ${totalTokens}`);

            let structuredResult: Record<string, any> = {};

            // STEP 1: Split
            let sections: Record<string, string>;
            if (totalTokens > this.MAX_TOKENS) {
                this.logger.warn("CV too large, splitting into sections...");
                sections = splitCVIntoSections(rawCvText);
            } else {
                sections = { full: rawCvText };
            }

            // STEP 2: Process
            for (const [section, text] of Object.entries(sections)) {
                const sectionTokens = countTokens(text, this.MODEL);

                if (sectionTokens > this.MAX_TOKENS) {
                    this.logger.warn(`Section '${section}' too long (${sectionTokens}), chunking...`);

                    const chunks = chunkTextByLength(text, this.MAX_TOKENS);
                    const sectionData: any[] = [];

                    for (const chunk of chunks) {
                        const chunkResult = await this.callOpenAI(chunk, section);
                        sectionData.push(chunkResult);
                    }

                    structuredResult[section] = sectionData;

                } else {
                    const sectionResult = await this.callOpenAI(text, section);
                    structuredResult[section] = sectionResult;
                }
            }

            console.log('structuredResult', JSON.stringify(structuredResult.full, null, 2));

            this.logger.log("Structured CV generated successfully");
            return structuredResult.full;

        } catch (error) {
            this.logger.error("Error generating structured talent profile", error);
            throw new Error("Failed to generate structured talent profile");
        }
    }

    private async callOpenAI(
        text: string,
        sectionName: string
    ): Promise<any> {

        const systemPrompt = `
        You are a highly precise resume structuring assistant.

        Your task is to extract data from a CV section and return STRICTLY VALID JSON
        that EXACTLY matches the TalentProfile schema.

        ========================
        CRITICAL SCHEMA RULES
        ========================

        - You MUST use ONLY the exact field names from the schema.
        - You are STRICTLY FORBIDDEN from adding new fields.

        FIELD MAPPING (MANDATORY):
        - "degree" → "academicEducationLevelType"
        - "school" / "university" → "institutionName"
        - "position" → "jobTitle"
        - "company" → "companyName"

        If mapping is unclear → use empty values.

        ========================
        OBJECT COMPLETENESS
        ========================

        - ALL fields MUST be present.
        - NEVER omit fields.

        For arrays of records such as academicEducation, certification, operationalExperience,
        hardSkills, softSkills, domainSkills, managerialSkills, and languagesSkills:
        - Return [] when no real record exists.
        - Do NOT create placeholder items filled only with empty strings, nulls, zeros, false values, or empty arrays.
        - Only include an item if the CV contains meaningful information for that item.

        Use defaults:
        - string → ""
        - number → 0
        - boolean → false
        - date → null
        - array → []
        - object → {}

        ========================
        DATE FORMAT RULES
        ========================

        - Use ISO 8601 format:
        "2024-01-01T00:00:00.000Z"

        - If only year → January 1st
        - If month+year → first day
        - "Present" → endDate = null AND isCurrent = true
        - Missing → null

        ========================
        SKILLS STRUCTURE (STRICT)
        ========================

        ALL skills MUST be OBJECTS, NOT strings.

        hardSkills:
        {
            skillName: string,
            skillType: "hard",
            expirienceInMonths: number,
            expirienceInYears: number,
            isVerified: false,
            proficiencyEstimation: "Beginner" | "Intern" | "Junior" | "Regular" | "Prof" | "Expert" | "Lead",
            startMonth: ISO string | null,
            subGroups: []
        }

        softSkills:
        {
            skillName: string,
            skillType: "soft",
            intensityEstimation: "Very Low" | "Low" | "Lower" | "Normal" | "Higher" | "Strong" | "Very High",
            isVerified: false
        }

        domainSkills:
        {
            skillName: string,
            skillType: "domain",
            isVerified: false,
            proficiencyEstimation: number, // 1-7  ~ Beginner, Intern, Junior, Regular, Preofessional, Expert, Lead
            expirienceInMonths: number,
            expirienceInYears: number
        }

        managerialSkills:
        {
            skillName: string,
            skillType: "managerial",
            level: "Coordinator" | "Lead" | "Project" | "Program" | "Portfolio" | "Director" | "C-Level Oficer",
            isVerified: false
        }

        languagesSkills:
        {
            skillName: string,
            skillType: "language",
            isVerified: false,
            languageSkillType: "general",
            proficiencyEstimation: number, // 1-7 ~ A0 - A1, A2, B1, B2, C1, C2
            expirienceInMonths: number,
            expirienceInYears: number
        }

                SKILL NAME EXTRACTION RULES:
                - Do NOT split a skill only because it contains "/".
                - Preserve established compound skill names as a single skill when the slash is part of one concept.
                    Examples: "CI/CD", "UI/UX", "B2B/B2C", "C/C++".
                - If the CV lists a main technology followed by technologies in parentheses, extract each explicit technology as its own relevant skill object.
                    Example: "Python (Django/FastAPI)" should produce separate skills such as "Python", "Django", and "FastAPI".
                - If the CV uses a category or platform followed by a list in parentheses, return separate skill objects for the parent platform and for each listed technology.
                    Examples:
                    - "AWS (S3, Lambda, CloudFront, Terraform)" -> "AWS", "Amazon S3", "AWS Lambda", "Amazon CloudFront", "Terraform"
                    - "Azure (Functions, App Insights, Service Bus, Blob, ADF)" -> "Azure", "Azure Functions", "Azure Application Insights", "Azure Service Bus", "Azure Blob Storage", "Azure Data Factory"
                    - "Testing (nUnit, xUnit, MSTest, Moq, NSubstitute, Jest, Karma, Jasmine, SonarQube)" -> separate skill objects for each listed tool/framework
                - Do NOT return synthetic combined framework names such as "Django/FastAPI" when the parentheses clearly list separate technologies.
                - Prefer precise, canonical skill names with original casing.

        ========================

        academicEducation, certification, operationalExperience objects must have the following structure: 

        - AcademicEducation must contain:
            - academicEducationLevelType (*possible academic education level types:
                "Any" | "Primary education" 
                | "Lower secondary education" | "Upper secondary education" | "Post-secondary non-tertiary education" 
                | "Short-cycle tertiary education" | "Bachelor of Arts, Humanities and Social Sciences" 
                | "Bachelor of Sciences" | "Bachelor of Engineering (Software, Robotics and Physics)" 
                | "Bachelor of Law" | "Masters of Arts, Humanities and Social Sciences" 
                | "Masters of Sciences and Humanities" | "Masters of Biology" | "Masters of Sciences" 
                | "Masters of Computer Science" | "Masters of Engineering" | "Masters of Mathematics" | "Masters of Physics" 
                | "Masters of Business Administration" | "Masters of Philosophy: Advanced research Masters degree" 
                | "Masters of Research: Contains some taught and research elements" | "Masters of Law" 
                | "Doctor of Philosophy" | "Other")
            - institutionName
            - fieldOfStudy
            - startStudyDate (ISO string, e.g., "2026-03-12T04:16:03.668Z")
            - graduationDate (ISO string)
            - specialication
            - additionalInformation
            - currentlyStudying
        - OperationalExperience must contain:
            - jobTitle
            - companyName
            - startWorkDate (ISO string)
            - endWorkDate (ISO string)
            - isCurrent
            - resposiblities
            - achievements (array of strings)
        - Certification must contain:
            - skillName (certification name)
            - certificationCenter
            - certificationDate (ISO string)
            - description

        ========================

        user object must have the following structure: 
        - firstname
        - lastname
        - fullname
        - email
        - phone
        - title

        ========================
        - You MUST use "operationalExperience", NOT "experience"
        - You MUST use "academicEducation", NOT "education"
        - You MUST use "certification", NOT "certifications"
        ========================

        ========================
        ⚠️ CRITICAL STRUCTURE RULES:

        1. ALL skill groups MUST be returned as separate top-level fields:
        - "skills"
        - "hardSkills"
        - "softSkills"
        - "domainSkills"
        - "managerialSkills"
        - "languagesSkills"

        2. DO NOT nest skill groups inside "skills".

        ❌ WRONG:
        {
        "skills": {
            "hardSkills": [],
            "softSkills": []
        }
        }

        ✅ CORRECT:
        {
        "skills": [],
        "hardSkills": [],
        "softSkills": [],
        "domainSkills": [],
        "managerialSkills": [],
        "languagesSkills": []
        }

        3. "skills" is a GENERAL skills array (can be empty), NOT a container.

        4. Always return arrays for skill fields, even if empty.

        5. Use exact field names from schema. Do not rename anything.

        6. Dates must be in ISO format (YYYY-MM-DD or full ISO string).

        7. - All other fields from TalentProfile (summary, objective, hobbies, targetPosition, userSocialMediaList) should also be included even if empty.

        8. Use:
        - null for missing objects
        - [] for missing arrays
        - "" for missing strings

        9. Do NOT add extra fields.

        10. Output ONLY valid JSON. No explanations.
        ========================

        ========================
        OUTPUT RULES
        ========================

        - Output MUST be valid JSON
        - No explanations
        - No extra text
        - No comments
        `;

        const userPrompt = `
        Parse the following CV section into TalentProfile JSON.

        CV SECTION:
        ${text}

        Return ONLY JSON.
        `;

        const response = await this.getOpenAI().chat.completions.create({
            model: this.MODEL,
            //temperature: 0,
            reasoning_effort: "medium",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            response_format: { type: "json_object" }
        });

        const message = response.choices[0].message?.content || "{}";

        try {
            return JSON.parse(message);
        } catch {
            this.logger.warn(`Invalid JSON for ${sectionName}`);
            return {};
        }
    }

    async generateStructuredTalentProfile(
        rawCvText: string
    ): Promise<TalentProfile> {
        try {
            const totalTokens = countTokens(rawCvText, this.MODEL);
            this.logger.log(`Total CV token length: ${totalTokens}`);

            // ✅ ALWAYS use section-based approach
            const result = await this.generateStructuredTalentProfileBySections(rawCvText);

            return this.postProcessProfile(result);

        } catch (error) {
            this.logger.error('Error generating structured talent profile', error);
            throw new Error('Failed to generate structured talent profile');
        }
    }

    private postProcessProfile(profile: TalentProfile): TalentProfile {
        profile.academicEducation = this.removeEmptyRecords(
            profile.academicEducation,
            ['academicEducationLevelType', 'institutionName', 'fieldOfStudy', 'specialication', 'certificateNumber', 'institution', 'faculty']
        );
        profile.certification = this.removeEmptyRecords(
            profile.certification,
            ['skillName', 'certificationCenter', 'description', 'certificateNumber']
        );
        profile.operationalExperience = this.removeEmptyRecords(
            profile.operationalExperience,
            ['jobTitle', 'companyName', 'workExpirienceName', 'resposiblities', 'achievements', 'additionalInfo']
        );

        // Process each skill type explicitly to maintain type safety
        if (Array.isArray(profile.hardSkills)) {
            profile.hardSkills = this.normalizeAndDeduplicateSkillObjects(
                this.removeEmptyRecords(profile.hardSkills, ['skillName'])
            );
        }
        if (Array.isArray(profile.softSkills)) {
            profile.softSkills = this.normalizeAndDeduplicateSkillObjects(
                this.removeEmptyRecords(profile.softSkills, ['skillName'])
            );
        }
        if (Array.isArray(profile.domainSkills)) {
            profile.domainSkills = this.normalizeAndDeduplicateSkillObjects(
                this.removeEmptyRecords(profile.domainSkills, ['skillName'])
            );
        }
        if (Array.isArray(profile.managerialSkills)) {
            profile.managerialSkills = this.normalizeAndDeduplicateSkillObjects(
                this.removeEmptyRecords(profile.managerialSkills, ['skillName'])
            );
        }
        if (Array.isArray(profile.languagesSkills)) {
            profile.languagesSkills = this.normalizeAndDeduplicateSkillObjects(
                this.removeEmptyRecords(profile.languagesSkills, ['skillName'])
            );
        }

        // Also handle generic "skills" array if present
        if (Array.isArray(profile.skills)) {
            profile.skills = this.normalizeAndDeduplicateSkillObjects(
                this.removeEmptyRecords(profile.skills, ['skillName'])
            );
        }

        return profile;
    }

    private removeEmptyRecords<T>(records: T[] | undefined, relevantFields: string[]): T[] {
        if (!Array.isArray(records)) {
            return [];
        }

        return records.filter(record => this.recordHasMeaningfulContent(record, relevantFields));
    }

    private recordHasMeaningfulContent(record: unknown, relevantFields: string[]): boolean {
        if (!record || typeof record !== 'object') {
            return false;
        }

        return relevantFields.some(fieldPath => {
            const value = this.getNestedValue(record as Record<string, unknown>, fieldPath);
            return this.isMeaningfulValue(value);
        });
    }

    private getNestedValue(source: Record<string, unknown>, fieldPath: string): unknown {
        return fieldPath.split('.').reduce<unknown>((currentValue, segment) => {
            if (!currentValue || typeof currentValue !== 'object') {
                return undefined;
            }

            return (currentValue as Record<string, unknown>)[segment];
        }, source);
    }

    private isMeaningfulValue(value: unknown): boolean {
        if (value === null || value === undefined) {
            return false;
        }

        if (typeof value === 'string') {
            const normalizedValue = value.trim();
            if (!normalizedValue) {
                return false;
            }

            return !['other', 'unknown', 'n/a', 'na', 'none'].includes(normalizedValue.toLowerCase());
        }

        if (Array.isArray(value)) {
            return value.some(item => this.isMeaningfulValue(item));
        }

        if (typeof value === 'object') {
            return Object.values(value as Record<string, unknown>).some(item => this.isMeaningfulValue(item));
        }

        return false;
    }

    /**
     * Normalizes skill names and removes duplicates without forcing slash-based splitting.
     */
    private normalizeAndDeduplicateSkillObjects<T extends { skillName?: string }>(skills: T[]): T[] {
        const normalizedSkills: T[] = [];
        const seen = new Set<string>();

        for (const skill of skills) {
            const expandedSkillNames = this.expandGroupedSkillNames(skill.skillName);
            for (const expandedSkillName of expandedSkillNames) {
                const dedupeKey = expandedSkillName.toLowerCase();
                if (seen.has(dedupeKey)) {
                    continue;
                }

                seen.add(dedupeKey);
                normalizedSkills.push({
                    ...skill,
                    skillName: expandedSkillName
                } as T);
            }
        }

        return normalizedSkills;
    }

    private expandGroupedSkillNames(skillName?: string): string[] {
        const normalizedSkillName = this.normalizeSkillName(skillName);
        if (!normalizedSkillName) {
            return [];
        }

        const groupedMatch = normalizedSkillName.match(/^(.*?)\s*\((.*?)\)$/);
        if (!groupedMatch) {
            return [normalizedSkillName];
        }

        const parentSkillName = this.normalizeSkillName(groupedMatch[1]);
        const groupedChildren = this.splitGroupedSkillNames(groupedMatch[2]);
        if (!parentSkillName || groupedChildren.length === 0) {
            return [normalizedSkillName];
        }

        const includeParentSkill = parentSkillName.trim().toLowerCase() !== 'testing';

        return [
            ...(includeParentSkill ? [parentSkillName] : []),
            ...groupedChildren.map(child => this.qualifyGroupedSkillName(parentSkillName, child))
        ];
    }

    private splitGroupedSkillNames(groupedSkillNames: string): string[] {
        return groupedSkillNames
            .split(/[;,]/)
            .flatMap(skillPart => {
                const normalizedPart = this.normalizeSkillName(skillPart);
                if (!normalizedPart) {
                    return [];
                }

                if (!normalizedPart.includes('/') || this.isCompoundSlashSkill(normalizedPart)) {
                    return [normalizedPart];
                }

                return normalizedPart
                    .split('/')
                    .map(part => this.normalizeSkillName(part))
                    .filter(Boolean);
            });
    }

    private isCompoundSlashSkill(skillName: string): boolean {
        const compoundSkills = new Set([
            'ci/cd',
            'ui/ux',
            'b2b/b2c',
            'c/c++'
        ]);

        return compoundSkills.has(skillName.trim().toLowerCase());
    }

    private qualifyGroupedSkillName(parentSkillName: string, childSkillName: string): string {
        const normalizedParent = parentSkillName.trim().toLowerCase();
        const normalizedChild = childSkillName.trim().toLowerCase();

        if (normalizedParent === 'aws') {
            const awsSkillNames: Record<string, string> = {
                s3: 'Amazon S3',
                lambda: 'AWS Lambda',
                cloudfront: 'Amazon CloudFront'
            };

            return awsSkillNames[normalizedChild] || childSkillName;
        }

        if (normalizedParent === 'azure') {
            const azureSkillNames: Record<string, string> = {
                functions: 'Azure Functions',
                'app insights': 'Azure Application Insights',
                'application insights': 'Azure Application Insights',
                'service bus': 'Azure Service Bus',
                blob: 'Azure Blob Storage',
                adf: 'Azure Data Factory'
            };

            return azureSkillNames[normalizedChild] || childSkillName;
        }

        return childSkillName;
    }

    private normalizeSkillName(skillName?: string): string {
        if (!skillName) {
            return '';
        }

        return skillName
            .replace(/\s+/g, ' ')
            .replace(/\s*\/\s*/g, '/')
            .replace(/\s*\(\s*/g, ' (')
            .replace(/\s*\)\s*/g, ') ')
            .trim();
    }

    async generateCodeSnippetWithAI(
        description: string,
        language: string
    ): Promise<any> {

        const systemPrompt = `
        You are a senior software engineer and code generation assistant.

        Your task is to generate a single high-quality, practical code snippet.

        STRICT RULES:
        - Return ONLY a valid JSON object
        - Do NOT include markdown (no \`\`\`)
        - Do NOT include explanations or text outside JSON
        - The JSON must match EXACTLY this structure:

        {
        "title": string,
        "code": string,
        "language": string
        }

        FIELD REQUIREMENTS:
        - title: short and descriptive (max 60 chars)
        - code: clean, production-quality code snippet
        - language: must match the requested language exactly

        CODE REQUIREMENTS:
        - Must be realistic and useful
        - Must follow best practices for the given language
        - Avoid trivial examples like "hello world"
        - Keep it concise but meaningful

        If the request is not programming-related:
        Return:
        {
        "title": "Invalid request",
        "code": "// Request must be programming-related",
        "language": "${language}"
        }
        `;

        const userPrompt = `
        Generate a ${language} code snippet.

        Description:
        ${description}

        Requirements:
        - Match the description
        - Use best practices for ${language}
        - Keep code clean and readable
        `;

        try {
            const response = await this.getOpenAI().chat.completions.create({
                model: this.MODEL,
                temperature: 0,
                reasoning_effort: "medium",
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                response_format: { type: "json_object" }
            });

            const message = response.choices[0].message?.content || "{}";

            const parsed = JSON.parse(message);

            return parsed;
        } catch (err) {
            this.logger.error('Error generating snippet', err);

            return {
                title: "Generation error",
                code: "// Failed to generate snippet",
                language
            };
        }
    }
}