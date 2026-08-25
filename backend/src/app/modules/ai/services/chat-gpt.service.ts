import { Injectable } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import { BaseService } from '../../base/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { EmptyModel } from '../../base/models/empty-model';

@Injectable()
export class ChatGptService extends BaseService<any> {

  private readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY2;
  private readonly API_URL_COMPLETIONS = 'https://api.openai.com/v1/chat/completions';
  private readonly API_URL_IMAGES = 'https://api.openai.com/v1/images/generations';

  constructor(
    @InjectModel(EmptyModel.name)
    protected readonly model: Model<any>,

    @InjectRepository(EmptyModel)
    protected readonly repository: Repository<any>

  ) {
    super(model, repository);
  }

  async generateContent(topic: any, isImageNeeded: any): Promise<any> {
    try {
      // Step 1: Generate Article
      const articleResponse = await axios.post(
        this.API_URL_COMPLETIONS,
        {
          model: 'gpt-4.1-mini',
          messages: [{ role: 'system', content: `Write a detailed article about ${topic}.` }],
          max_tokens: 800,
        },
        { headers: { Authorization: `Bearer ${this.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
      );

      const articleText = articleResponse.data.choices[0].message.content;

      //Step 2: Generate Images
      let images = [];
      if (isImageNeeded === 'true') {
        const imagePromises = Array.from({ length: 3 }, (_, i) =>
          axios.post(
            this.API_URL_IMAGES,
            {
              model: 'dall-e-2',
              prompt: `A high-quality illustration about ${topic}, image ${i + 1}`,
              n: 1,
              size: '1024x1024',
            },
            { headers: { Authorization: `Bearer ${this.OPENAI_API_KEY}`, 'Content-Type': 'application/json' } }
          )
        );

        const imageResponses = await Promise.all(imagePromises);
        images = imageResponses.map((response) => response.data.data[0].url);
      }

      console.log('Article:', articleText);
      console.log('Images:', images);
      return isImageNeeded ? { article: articleText, images } : { article: articleText };
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error('Failed to generate content');
    }
  }

async generateOpenPosition(userInput: any): Promise<any> {
  try {
  // Predefine some fields if needed
  const predefined = {
    cooperationType: 'b2b',      // optional override
    involevementType: 'outsource',
    contractType: 'timeAndMaterial'
  };
  
//TODO: Move to separate config
  const systemPrompt = `
You are an HR assistant.
Generate a fully filled OpenPosition JSON EXACTLY matching this TypeScript model, using proper types.

{
  "title": "",
  "titleCode": "",
  "positionDetails": {
    "general": {
      "workPlace": "",
      "specificRequirements": []
    },
    "requirements": {
      "proficiencyLevel": "",
      "positionSkills": [],
      "requirementsSection": "",
      "isRequiredEducation": false,
      "isRequiredCertification": false,
      "requiredEducation": [],
      "requiredCertification": []
    },
    "conditions": {
      "cooperationType": "",
      "contractType": "",
      "budget": {
        "timeline": "",
        "maxBudgetAmount": 0,
        "annualBudget": 0
      },
      "contractMonthDuration": 0,
      "isIndefinitedDuration": false,
      "jobType": "",
      "involevementType": "",
      "benefits": []
    },
    "company": new CompanyVersion(),
    "additionalInfo": ""
  },
  "projectDescription": { 
    "sectionContent": "", 
    "sectionName": "Short Project Description", 
    "sectionKey": "ShortProjectDescription",
    "isIncluded": true 
  },
  "jobResponsibilities": { 
    "sectionContent": "", 
    "sectionName": "Job Responsibilities", 
    "sectionKey": "JobResponsibilities",
    "isIncluded": true 
  },
  "requirements": {
    "key": "-1",
    "orderId": -1,
    "requirementSections": [
      {
        "key": "-1",
        "orderId": 0,
        "sectionContent": "",
        "sectionKey": "MandatoryRequirements",
        "sectionName": "Mandatory requirements",
        "_isIncluded": true,
        "isIncluded": true
      },
      {
        "key": "-1",
        "orderId": 1,
        "sectionContent": "",
        "sectionKey": "DesiredSkillsAndKnowledge",
        "sectionName": "Desired skills and knowledge",
        "_isIncluded": true,
        "isIncluded": true
      },
      {
        "key": "-1",
        "orderId": 2,
        "sectionContent": "",
        "sectionKey": "ExtraPoints",
        "sectionName": "Extra Points",
        "_isIncluded": true,
        "isIncluded": true
      },
      {
        "key": "-1",
        "orderId": 3,
        "sectionContent": "",
        "sectionKey": "NiceToHave",
        "sectionName": "Nice to have",
        "_isIncluded": true,
        "isIncluded": true
      }
    ],
    "sectionContent": "",
    "sectionKey": "PositionRequirements",
    "sectionName": "Requirements",
    "_isIncluded": true,
    "isIncluded": true
  },
  "benefits": { 
    "sectionContent": "", 
    "sectionName": "Benefits", 
    "sectionKey": "Benefits",
    "isIncluded": true 
  },
  "summary": { 
    "sectionContent": "", 
    "sectionName": "Summary", 
    "sectionKey": "Summary",
    "isIncluded": true 
  },
  "contactNumber": "",
  "isVerified": true
}

RULES:
- Return ONLY JSON, do NOT wrap it in triple backticks.
- No explanations, no text outside the JSON.
- Fill all empty strings with high-quality HR-standard content.
- In "conditions.benefits", generate objects similar to:
  {
    benefit: "Insurance",
    dateTimeCreated: "2025-08-29T07:49:42.988Z",
    isVerified: false,
    subgroups: []
  }
- Use ONLY the following values for enums:
  ProficiencyLevel: 'Beginner', 'Intern', 'Junior', 'Regular', 'Prof', 'Expert', 'Lead'
  JobType: 'Any', 'Full Time', 'Part Time', 'Project', 'Contract', 'Task', 'Consulting', 'Internship'
  WorkPlace: 'Any', 'Remote', 'Hybrid', 'Office'
  budget.timeline: 'Per Hour', 'Per Day', 'Per Week', 'Per Month', 'Per Year', 'Per Contract'
  CooperationType: "Any", "Employment Staffing", "B2B"
  InvolevementType: "Any", "In-House", "Outsource", "Outstaff"
  ContractType: "Time and Material", "Fixed Price", "Fee Based"
- For benefits[], copy the same benefits as listed in benefitsSection (approximate content)
- All dates should be valid ISO strings.
- All text must be high-quality HR-standard content.
- "positionSkills" must be objects:
  isVerified, proficiencyLevel, skillImportance, skillName, skillType, _weightedCoefficient.
  Use only these values:
    ProficiencyLevel: Beginner, Intern, Junior, Regular, Prof, Expert, Lead
    SkillImportance: 100%, 75%, 50%, 25%
    SkillType: Hard, Soft, Managerial and Leadership, Domain, Language
  Include at least one skill for each of the following skillType categories:
    1. Hard
    2. Soft
    3. Managerial and Leadership
    4. Domain
    5. Language
  Enrich skills with the most popular skills for the given position. 
  Do NOT omit any skillType category. Exactly 5 categories must appear, minimum 1 skill per category.

- "requirements" is a sectioned object with:
  - Mandatory requirements
  - Desired skills and knowledge
  - Extra Points
  - Nice to have
  Fill each section with relevant content. Then combine all sectionContents into the main requirements.sectionContent with <h4></h4>  headers.

- "Summary" sectionContent must concatenate all main sections:
  - ShortProjectDescription
  - JobResponsibilities
  - Requirements (all requirementSections)
  - Benefits
  Each with <h4> header and line breaks before content. Include requirementSections as <h4>{sectionName}</h4>{sectionContent}.

- ALL requirementSections.sectionContent must format bullet points so that each bullet is on its own new line.  
   Use either:
     • Text\nText\nText\n
   OR  
     • Text<br/>Text<br/>Text<br/>
   Never place multiple bullets on the same line.

- NEVER generate multiple bullet items on the same line.  
   Example (WRONG): "• Item A • Item B • Item C"  
   Example (CORRECT):
     • Item A
     • Item B
     • Item C
`;

  const userPrompt = `
Fill the OpenPosition model using this input:
${JSON.stringify(userInput, null, 2)}

Use predefined fields if needed:
${JSON.stringify(predefined, null, 2)}

Return full OpenPosition JSON.
`;

  const response = await axios.post(
    this.API_URL_COMPLETIONS,
    {
      model: 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.4
    },
    {
      headers: {
        Authorization: `Bearer ${this.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );

  const rawContent = response.data.choices[0].message.content;

  const cleanedContent = rawContent
    .trim()
    .replace(/^```json/, '')
    .replace(/^```/, '')
    .replace(/```$/, '');

  
    const result = JSON.parse(cleanedContent);

    const sectionsForSummary: string[] = [];

    if (result.projectDescription?.sectionContent) {
      sectionsForSummary.push(`<h4>${result.projectDescription.sectionName}</h4>\n${result.projectDescription.sectionContent}`);
    }

    if (result.jobResponsibilities?.sectionContent) {
      sectionsForSummary.push(`<h4>${result.jobResponsibilities.sectionName}</h4>\n${result.jobResponsibilities.sectionContent}`);
    }

    if (result.requirements?.requirementSections?.length) {
      const reqSections = result.requirements.requirementSections
        .map((sec: any) => `<h4>${sec.sectionName}</h4>\n${sec.sectionContent}`)
        .join('\n');
      sectionsForSummary.push(`<h4>${result.requirements.sectionName}</h4>\n${reqSections}`);
    }

    if (result.benefits?.sectionContent) {
      sectionsForSummary.push(`<h4>${result.benefits.sectionName}</h4>\n${result.benefits.sectionContent}`);
    }

    result.requirements.requirementSections =
    result.requirements.requirementSections.map((sec: any) => ({
      ...sec,
      sectionContent: fixBulletFormatting(sec.sectionContent)
    }));

    result.summary = {
      sectionName: "Summary",
      sectionKey: "Summary",
      isIncluded: true,
      sectionContent: sectionsForSummary.join('\n\n')
    };

    return result;
  } catch (e) {
    console.error('Failed to parse OpenPosition JSON:', e);
    throw new Error('OpenPosition generation failed: invalid JSON');
  }
}

}

function fixBulletFormatting(text: string): string {
  // Ensure every "•" goes to a new line
  return text
    .replace(/•\s*/g, '\n• ')
    .replace(/\n+/g, '\n') 
    .trim();
}