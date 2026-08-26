
import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { encoding_for_model, get_encoding, TiktokenModel } from "tiktoken";
import { TalentProfile } from '../../profiles/models/talent-profile';

interface CodeSnippet {
  title: string;
  code: string;
  language: string;
}

@Injectable()
export class CodeSnippetsGeneratorService {
    private MAX_TOKENS = 120000;
    private MODEL = "gpt-5";
    private openai?: OpenAI;
    private readonly logger = new Logger(CodeSnippetsGeneratorService.name);

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
                temperature: 1,
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