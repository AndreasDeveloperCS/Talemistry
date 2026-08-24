
import { BadRequestException, Injectable } from '@nestjs/common';
import { ParsedResumeDto } from '../models/parsed-resume.dto';
const pdf = require('pdf-parse');

const { PDFParse } = require('pdf-parse');
// import { PDFParse } from 'pdf-parse';
interface PdfParseResult {
    text?: string;
    [key: string]: any;
}

type PdfParseFn = (buffer: Buffer) => Promise<{ text?: string;[key: string]: any }>;
type PdfParseClass = new (opts?: Record<string, any>) => {
    parseBuffer: (buf: Buffer) => Promise<{ text?: string;[key: string]: any }>;
};

let pdfParserInstance: InstanceType<PdfParseClass> | null = null;

let cachedPdfParse: PdfParseFn | null = null;

// 👇 cached instance
let pdfParseFn: PdfParseFn | null = null;
interface ExperienceItem {
    title?: string;
    company?: string;
    period?: string;
    bullets: string[];
}

@Injectable()
export class ResumeParserService {
    private parserInstance: any | null = null;
    private parserCls: any | null = null;
    /** Create and cache PDFParse instance */

    private async getPdfParseClass(): Promise<any> {
        if (this.parserCls) return this.parserCls;

        const mod: any = await import('pdf-parse');
        const ns = mod?.default ?? mod;
        const PDFParseCls = ns?.PDFParse;
        if (typeof PDFParseCls !== 'function') {
            throw new Error(
                `Unsupported pdf-parse module shape. Keys: ${Object.keys(ns || {})}`
            );
        }
        this.parserCls = PDFParseCls;
        return PDFParseCls;
    }
    private async getParserInstance() {
        if (this.parserInstance) return this.parserInstance;

        const mod: any = await import('pdf-parse');

        // v2.4.4 always exposes the class under default.PDFParse
        const ns = mod?.default ?? mod;
        const PDFParseCls = ns?.PDFParse;
        const VerbosityLevel = ns?.VerbosityLevel ?? { ERRORS: 0 };

        if (typeof PDFParseCls !== 'function') {
            console.error(`pdf-parse module shape unsupported. ${Object.keys(ns || {})}`);

            // throw new Error(
            //     `pdf-parse module shape unsupported. Keys: ${Object.keys(ns || {})}`,
            // );
        }

        const instance = new PDFParseCls({
            verbosity: VerbosityLevel.ERRORS,
            max: 0,
            version: 'v2',
        });

        if (
            typeof instance.parseBuffer !== 'function' &&
            typeof instance.parse !== 'function'
        ) {
            console.error('Loaded PDFParse but missing parseBuffer/parse methods');

            // throw new Error('Loaded PDFParse but missing parseBuffer/parse methods');
        }

        this.parserInstance = instance;
        return instance;
    }

    private async getPdfParser1(): Promise<InstanceType<PdfParseClass>> {
        if (pdfParserInstance) return pdfParserInstance;

        const mod: any = await import('pdf-parse');

        const PdfParse =
            mod?.default?.PDFParse ||
            mod?.PDFParse ||
            mod?.default?.default?.PDFParse;

        if (!PdfParse) {
            console.error('PdfParse Loaded PDFParse but missing parseBuffer/parse methods', PdfParse);

            // throw new Error(
            //     `Cannot locate PDFParse class in pdf-parse module. Keys: ${Object.keys(mod || {})}`,
            // );
        }

        // Create an instance
        pdfParserInstance = new PdfParse({
            max: 0,
            version: 'v2',
        });

        return pdfParserInstance;
    }

    private async getPdfParser(): Promise<PdfParseFn> {
        if (pdfParseFn) return pdfParseFn;

        // Attempt normal dynamic import
        const mod: any = await import('pdf-parse');
        console.log(mod);

        // Handle both possible shapes:
        // - ESM: { default: [Function] }
        // - CJS: [Function]
        // Detect callable export in all known shapes

        const fn =
            typeof mod === 'function'
                ? mod
                : typeof mod?.default === 'function'
                    ? mod.default
                    : typeof mod?.default?.default === 'function'
                        ? mod.default.default
                        : typeof mod?.default?.default?.default === 'function'
                            ? mod.default.default.default
                            : null;


        if (!fn) {
            throw new Error(
                `Failed to load pdf-parse module — unsupported export shape: ${Object.keys(mod || {})}`,
            );
        }

        pdfParseFn = fn as PdfParseFn;
        return pdfParseFn;
    }

    private async getPdfParser2(): Promise<PdfParseFn> {
        if (cachedPdfParse) return cachedPdfParse;

        const mod: any = await import('pdf-parse');

        // Prefer: function export (CJS or ESM default)
        const fnCandidate =
            typeof mod === 'function'
                ? mod
                : typeof mod?.default === 'function'
                    ? mod.default
                    : typeof mod?.default?.default === 'function'
                        ? mod.default.default
                        : null;

        if (fnCandidate) {
            cachedPdfParse = fnCandidate as PdfParseFn;
            return cachedPdfParse;
        }

        // Fallback: class export (modern builds)
        // Take the “namespace” (default if present, else the module itself)
        const ns = (mod && typeof mod.default === 'object' && mod.default) || mod;

        const PDFParseCls = ns?.PDFParse;
        if (typeof PDFParseCls === 'function') {
            // Pull verbosity enum if available; default to 0 (ERRORS)
            const VerbosityLevel = ns?.VerbosityLevel ?? { ERRORS: 0 };
            // IMPORTANT: pass an options object so `options.verbosity` exists
            const instance = new PDFParseCls({
                // optional knobs you can tweak:
                max: 0, // no page limit
                version: 'v2',
                verbosity: VerbosityLevel.ERRORS ?? 0,
                // pagerender: (pageData) => pageData.getTextContent().then(tc => tc.items.map(i=>i.str).join(' ')),
            });

            if (typeof instance.parseBuffer === 'function') {
                cachedPdfParse = (buf: Buffer) => instance.parseBuffer(buf);
                return cachedPdfParse;
            }
            if (typeof instance.parse === 'function') {
                cachedPdfParse = (buf: Buffer) => instance.parse(buf);
                return cachedPdfParse;
            }
            // Some builds expose a static parse
            if (typeof PDFParseCls.parse === 'function') {
                cachedPdfParse = (buf: Buffer) => PDFParseCls.parse(buf);
                return cachedPdfParse;
            }
        }

        // No usable export
        throw new Error(
            `Failed to load pdf-parse — no callable export found. Keys: ${Object.keys(mod || {})}`
        );
    }

    async parsePDFPath(pdfBuffer: Buffer, pdfPath: string): Promise<ParsedResumeDto> {
        const header = pdfBuffer.subarray(0, 5).toString('ascii');
        const isPdf = header === '%PDF-';
        console.log('isPDF PDF', isPdf);

        if (!isPdf) throw new BadRequestException('Not a PDF file');

        const parser = new PDFParse({ url: pdfPath });

        const data = await parser.getText();

        const raw = this.postProcessText(data.text);
        const sections = this.splitIntoSections(raw);
        return this.extractStructured(sections, raw);
    }

    async parse(pdfBuffer: Buffer): Promise<ParsedResumeDto> {
        const header = pdfBuffer.subarray(0, 5).toString('ascii');
        const isPdf = header === '%PDF-';
        console.log('isPDF PDF', isPdf);

        if (!isPdf) throw new BadRequestException('Not a PDF file');

        let data: any;
        try {
            pdf(pdfBuffer).then(result => console.log('OLD school pdf parsed text', result.text));
        } catch (err) {
            console.error('OLD school PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }
        try {
            //this.run();
        } catch (err) {
            console.error('PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }
        try {
            const PDFParseCls = await this.getPdfParseClass();
            const ns: any = (await import('pdf-parse')).default ?? (await import('pdf-parse'));
            const VerbosityLevel = ns?.VerbosityLevel ?? { ERRORS: 0 };

            // ✅ must pass an options object or it crashes
            const parser = new PDFParseCls({
                verbosity: VerbosityLevel.ERRORS,
                max: 0,
                version: 'v2',
            });
            const pdfDoc = await parser.loadPDF(pdfBuffer);
            const textContent = await parser.getRawTextContent(pdfDoc);
            data = { text: textContent };
        } catch (err) {
            console.error('PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }
        try {
            const parser = await this.getParserInstance();
            console.log('pdfParse type:', typeof parser);
            data =
                typeof parser.parseBuffer === 'function'
                    ? await parser.parseBuffer(pdfBuffer)
                    : await parser.parse(pdfBuffer);
        } catch (err) {
            console.error('PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }
        try {
            const pdfParse = await this.getPdfParser();
            console.log('pdfParse type:', typeof pdfParse);

            data = await pdfParse(pdfBuffer);
        } catch (err) {
            console.error('PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }


        try {
            const getPdfParser2 = await this.getPdfParser2();
            console.log('pdfParse type:', typeof getPdfParser2);

            data = await getPdfParser2(pdfBuffer);
        } catch (err) {
            console.error('PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }

        try {
            const parser = await this.getPdfParser1();
            console.log('pdfParse type:', typeof parser);

            data = await parser.parseBuffer(pdfBuffer);
        } catch (err) {
            console.error('PDF parsing issue', err);
            //throw new BadRequestException('Failed to parse PDF file');
        }

        if (!data?.text) {
            throw new BadRequestException('No text extracted from PDF');
        }

        const raw = this.postProcessText(data.text);
        const sections = this.splitIntoSections(raw);
        return this.extractStructured(sections, raw);
    }


    private postProcessText(t: string) {
        return t
            .replace(/\r/g, '\n')
            .replace(/\u2022|\u25CF|\u25A0/g, '•')       // unify bullets
            .replace(/[ \t]+\n/g, '\n')                   // trim line ends
            .replace(/\n{3,}/g, '\n\n')                   // collapse blank lines
            .trim();
    }

    private splitIntoSections(t: string): Record<string, string> {
        // naive headings map; improve with ML later
        const headings = [
            'summary', 'profile', 'skills', 'technical skills', 'experience', 'work experience',
            'employment history', 'projects', 'education', 'certifications', 'languages'
        ];
        const lines = t.split('\n');
        const sections: Record<string, string> = { _: '' };
        let current = '_';

        for (const line of lines) {
            const key = headings.find(h => new RegExp(`^\\s*${h}\\s*:?$`, 'i').test(line));
            if (key) {
                current = key.toLowerCase();
                sections[current] = '';
                continue;
            }
            sections[current] = (sections[current] ? sections[current] + '\n' : '') + line;
        }
        return sections;
    }

    private extractStructured(sections: Record<string, string>, fullText: string): ParsedResumeDto {
        return {
            identity: null,
            contacts: null,
            socialLinks: null,
            projects: null,
            meta: null,
            name: this.extractName(fullText),
            surname: this.extractName(fullText),
            fullname: this.extractName(fullText),
            emails: this.findEmails(fullText),
            phones: this.findPhones(fullText),
            location: this.findLocation(fullText),
            links: null,
            // links: this.findLinks(fullText),
            skills: this.extractSkills(sections),
            experience: this.extractExperience(sections),
            education: this.extractEducation(sections),
            certifications: this.extractCerts(sections),
            languages: this.extractLanguages(sections),
            rawText: fullText
        };
    }

    private findEmails(t: string) {
        return Array.from(new Set((t.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])));
    }
    private findPhones(t: string) {
        return Array.from(new Set((t.match(/(?:\+\d{1,3}\s?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g) || [])));
    }
    private findLinks(t: string) {
        return Array.from(new Set((t.match(/\bhttps?:\/\/[^\s)]+/gi) || [])));
    }
    private findLocation(t: string) {
        const m = t.match(/\b([A-Za-zÀ-ž.'-]+,\s*[A-Za-zÀ-ž.'-]+)\b/); // “City, Country” naive
        return m?.[1];
    }

    private extractSkills(sections: Record<string, string>): string[] {
        const src = (sections['skills'] || sections['technical skills'] || '').toLowerCase();
        const tokens = src.split(/[,;•\n]+/).map(s => s.trim()).filter(Boolean);
        return Array.from(new Set(tokens));
    }

    private extractExperience(sections: Record<string, string>): ExperienceItem[] {
        const src = (sections['experience'] || sections['work experience'] || sections['employment history'] || sections['operational experience'] || '');
        const blocks = src.split(/\n{2,}/).map(b => b.trim()).filter(Boolean);
        return blocks.map(b => {
            const title = b.match(/^(.*?)(?:\s+[-–]\s+|,\s+)([^,\n]+)$/m)?.[1] ?? b.split('\n')[0];
            const company = b.match(/ at ([^,\n]+)|,\s*([^,\n]+)$/i)?.[1] || '';
            const period = b.match(/\b(20\d{2}|19\d{2}).{0,3}(present|now|20\d{2}|19\d{2})/i)?.[0] || '';
            const bullets = b.split('\n').slice(1).filter(x => x.startsWith('•') || x.match(/^\s*-\s+/));
            return { title: title?.trim(), company: company?.trim(), period: period?.trim(), bullets };
        });
    }

    private extractEducation(sections: Record<string, string>) {
        const src = sections['education'] || '';
        return src.split(/\n{2,}/).map(b => {
            const degree = b.match(/(B\.Sc\.|M\.Sc\.|BSc|MSc|Bachelor|Master|PhD|Diploma)/i)?.[0] || '';
            const school = b.match(/\b(University|College|Polytechnic|Institute)[^,\n]*/i)?.[0] || '';
            const year = b.match(/\b(20\d{2}|19\d{2})\b/)?.[0] || '';
            return { degree, school, year };
        }).filter(x => x.degree || x.school || x.year);
    }

    private extractCerts(sections: Record<string, string>) {
        const src = sections['certifications'] || '';
        return src.split(/\n+/).map(s => s.trim()).filter(Boolean);
    }

    private extractLanguages(sections: Record<string, string>) {
        const src = sections['languages'] || '';
        const pairs = src.split(/[,;\n]+/).map(s => s.trim()).filter(Boolean);
        return pairs;
    }

    private extractName(t: string) {
        // naive: first non-contact line in the top ~5 lines
        const lines = t.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 6);
        return lines.find(s => s.split(' ').length <= 4 && !s.match(/@|http|linkedin|github|phone|email/i)) || '';
    }
}