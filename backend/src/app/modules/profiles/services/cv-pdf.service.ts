import { Injectable } from '@nestjs/common';
import PdfPrinter from 'pdfmake';
import * as fs from 'fs';
import axios from 'axios';
import { TalentProfile } from '../models/talent-profile';
import puppeteer from 'puppeteer';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { TemplateType } from '../models/cv-template-type.enum';
import { getBaseDir } from '../../../common/utils/path.helper';
import { TemplateColor } from '../models/cv-template-color.enum';
import { ProficiencyLevel } from '../../positions/models/position-item';

@Injectable()
export class CvPdfService {

  constructor() { }

  private resolvePublicAssetPath(...segments: string[]): string {
    const baseDir = getBaseDir();
    const candidatePaths = [
      path.join(baseDir, 'public', ...segments),
      path.join(baseDir, 'dist', 'public', ...segments),
    ];

    const resolvedPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));

    if (!resolvedPath) {
      throw new Error(`Public asset not found. Checked: ${candidatePaths.join(', ')}`);
    }

    return resolvedPath;
  }

  private normalizeTemplate(template: string | undefined): string {
    const candidate = template || TemplateType.MinimalistSingleColumn;

    try {
      this.resolvePublicAssetPath('cv-templates', 'html', `${candidate}.html`);
      this.resolvePublicAssetPath('cv-templates', 'styles', `${candidate}.css`);
      return candidate;
    } catch (error) {
      console.warn(`⚠️ Falling back to default CV template because "${candidate}" is unavailable.`, error);
      return TemplateType.MinimalistSingleColumn;
    }
  }

  private resolvePuppeteerExecutablePath(): string | undefined {
    const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH;

    if (configuredPath && fs.existsSync(configuredPath)) {
      return configuredPath;
    }

    const candidatePaths = [
      '/usr/bin/google-chrome-stable',
      '/usr/bin/google-chrome',
      '/usr/bin/chromium-browser',
      '/usr/bin/chromium',
    ];

    const discoveredPath = candidatePaths.find((candidatePath) => fs.existsSync(candidatePath));

    if (discoveredPath) {
      return discoveredPath;
    }

    try {
      return puppeteer.executablePath();
    } catch (error) {
      console.warn('⚠️ Puppeteer bundled browser path is unavailable.', error);
      return undefined;
    }
  }

  private async launchBrowser(executablePath: string | undefined, preferredArgs: string[], fallbackArgs: string[]) {
    const launchAttempts = [
      {
        label: 'preferred executable with preferred args',
        executablePath,
        args: preferredArgs,
      },
      {
        label: 'preferred executable with fallback args',
        executablePath,
        args: fallbackArgs,
      },
      {
        label: 'bundled executable with fallback args',
        executablePath: undefined,
        args: fallbackArgs,
      },
    ];

    const failures: string[] = [];

    for (const attempt of launchAttempts) {
      try {
        console.log(`🚀 Puppeteer launch attempt: ${attempt.label}`);
        return await puppeteer.launch({
          headless: true,
          executablePath: attempt.executablePath,
          args: attempt.args,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push(`${attempt.label}: ${message}`);
        console.warn(`⚠️ Puppeteer launch failed for ${attempt.label}`, error);
      }
    }

    throw new Error(`Unable to launch Puppeteer. Attempts: ${failures.join(' | ')}`);
  }

  private normalizeProfile(profile: TalentProfile): TalentProfile {
    const normalizedProfile = profile ?? new TalentProfile();

    normalizedProfile.user = normalizedProfile.user || ({} as any);
    normalizedProfile.preferences = normalizedProfile.preferences || ({} as any);
    normalizedProfile.hardSkills = normalizedProfile.hardSkills || [];
    normalizedProfile.softSkills = normalizedProfile.softSkills || [];
    normalizedProfile.domainSkills = normalizedProfile.domainSkills || [];
    normalizedProfile.managerialSkills = normalizedProfile.managerialSkills || [];
    normalizedProfile.languagesSkills = normalizedProfile.languagesSkills || [];
    normalizedProfile.operationalExperience = normalizedProfile.operationalExperience || [];
    normalizedProfile.academicEducation = normalizedProfile.academicEducation || [];
    normalizedProfile.certification = normalizedProfile.certification || [];

    return normalizedProfile;
  }

  async generateCV(
    profile: TalentProfile,
    template: TemplateType,
    colorTheme: TemplateColor
  ): Promise<Buffer> {
    const normalizedProfile = this.normalizeProfile(profile);
    const normalizedTemplate = this.normalizeTemplate(template);

    // Platform-specific Puppeteer configuration
    const isProduction = process.env.NODE_ENV === 'PROD';
    const isLinux = process.platform === 'linux';

    // Prefer the smallest stable set of flags on headless Ubuntu.
    const fallbackArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu'
    ];

    // Additional flags are kept as a first attempt only, then we fall back to a simpler launch.
    const linuxArgs = [
      '--disable-software-rasterizer',
      '--disable-extensions',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-accelerated-2d-canvas',
      '--disable-web-security'
    ];

    // Choose args based on platform
    const launchArgs = isLinux ? [...fallbackArgs, ...linuxArgs] : fallbackArgs;
    const executablePath = this.resolvePuppeteerExecutablePath();

    console.log(`🚀 Launching Puppeteer on ${process.platform} (${isProduction ? 'PROD' : 'DEV'})`);
    console.log(`🧭 Puppeteer executable: ${executablePath || 'bundled default'}`);

    let browser;
    try {
      browser = await this.launchBrowser(executablePath, launchArgs, fallbackArgs);

      const page = await browser.newPage();

      const cssPath = this.resolvePublicAssetPath('cv-templates', 'styles', `${normalizedTemplate}.css`);

      console.log(`🎨 Attempting to load CSS from: ${cssPath}`);
      console.log(`📁 CSS exists: ${fs.existsSync(cssPath)}`);

      if (!fs.existsSync(cssPath)) {
        const stylesDir = path.dirname(cssPath);
        if (fs.existsSync(stylesDir)) {
          const availableStyles = fs.readdirSync(stylesDir);
          console.error(`❌ CSS "${normalizedTemplate}.css" not found. Available styles:`, availableStyles);
        } else {
          console.error(`❌ Styles directory not found: ${stylesDir}`);
        }
        throw new Error(`CSS file not found: ${cssPath}`);
      }

      let css = fs.readFileSync(cssPath, 'utf-8');
      css = this.applyColorTheme(css, colorTheme);

      const html = await this.buildHtml(normalizedProfile, normalizedTemplate, css);

      await page.setContent(html, { waitUntil: 'domcontentloaded' });
      await page.emulateMediaType('screen');

      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        scale: 0.7, 
        margin: { top: '5mm', bottom: '5mm', left: '5mm', right: '5mm' },
      });

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('❌ Puppeteer error generating CV PDF:', error);
      throw error;
    } finally {
      // Always close the browser to prevent resource leaks
      if (browser) {
        try {
          await browser.close();
          console.log('✅ Browser closed successfully');
        } catch (closeError) {
          console.error('⚠️ Error closing browser:', closeError);
        }
      }
    }
  }

  private async buildHtml(profile: TalentProfile, template: string, css: string): Promise<string> {
    const filePath = this.resolvePublicAssetPath('cv-templates', 'html', `${template}.html`);

    const user = profile.user || ({} as any);
    const hardSkills = profile.hardSkills || [];
    const softSkills = profile.softSkills || [];
    const domainSkills = profile.domainSkills || [];
    const managerialSkills = profile.managerialSkills || [];
    const languagesSkills = profile.languagesSkills || [];
    const operationalExperience = profile.operationalExperience || [];
    const academicEducation = profile.academicEducation || [];
    const certification = profile.certification || [];

    console.log(`📄 Attempting to load CV template from: ${filePath}`);
    console.log(`📂 Base directory: ${getBaseDir()}`);
    console.log(`📁 Template exists: ${fs.existsSync(filePath)}`);

    if (!fs.existsSync(filePath)) {
      // Log available templates for debugging
      const templatesDir = path.dirname(filePath);
      if (fs.existsSync(templatesDir)) {
        const availableTemplates = fs.readdirSync(templatesDir);
        console.error(`❌ Template "${template}.html" not found. Available templates:`, availableTemplates);
      } else {
        console.error(`❌ Templates directory not found: ${templatesDir}`);
      }
      throw new Error(`Template file not found: ${filePath}`);
    }

    const source = fs.readFileSync(filePath, 'utf-8');

    // Register Handlebars helper for soft hyphenation in templates: {{shy text}}
    Handlebars.registerHelper('shy', (text: string) => softHyphenate(text));

    const templateFn = Handlebars.compile(source);

    const photoSource = await this.resolveImageSource(user.photo || null);

    const context = {
      FIRSTNAME: user.firstname || '',
      LASTNAME: user.lastname || '',
      FIRST_NAME: user.firstname || '',
      LAST_NAME: user.lastname || '',
      FULL_NAME: `${user.firstname || ''} ${user.lastname || ''}`.trim(),
      INITIALS: `${user.firstname?.[0] || ''}${user.lastname?.[0] || ''}`,
      TITLE: profile.targetPosition || '',
      EMAIL: user.email || '',
      PHONE: user.phone || '',
      YEARS_EXPERIENCE: this.calculateYearsExperience(operationalExperience),
      HAS_EXPERIENCE: this.calculateYearsExperience(operationalExperience) > 0,
      HAS_SKILLS: hardSkills.length > 0 || softSkills.length > 0
        || domainSkills.length > 0 || managerialSkills.length > 0,
      SKILLS_COUNT: hardSkills.length,
      CERT_COUNT: certification.length,
      LANG_COUNT: languagesSkills.length,
      CURRENTYEAR: new Date().getFullYear(),
      PHOTO: photoSource,
      OBJECTIVE: softHyphenate(profile.objective || ''),
      SUMMARY: softHyphenate(profile.summary || ''),
      FEATURED_EXPERIENCE:
        operationalExperience.length > 0
          ? this.mapExperience(operationalExperience[0], 0)
          : null,
      OTHER_EXPERIENCE: operationalExperience
        .slice(1)
        .map((exp, i) => this.mapExperience(exp, i + 1)),
      EXPERIENCE: operationalExperience.map((exp, i) =>
        this.mapExperience(exp, i)
      ),
      EDUCATION: academicEducation.map(edu => ({
        degree: edu.academicEducationLevelType,
        specialisation: edu.specialication,
        fieldOfStudy: edu.fieldOfStudy,
        institution: edu.institution?.internationalName || '',
        year: this.formatMonthYear(edu.graduationDate),
        description: softHyphenate(edu.fieldOfStudy || '')
      })),
      HARD_SKILLS: expandSlashSeparatedSkills(hardSkills.map(s => ({
        name: s.skillName,
        level: this.getSkillLabelFromNumeric(s.proficiencyEstimation),
        barWidth: this.getBarWidth(s.proficiencyEstimation)
      }))),
      SOFT_SKILLS: expandSlashSeparatedSkills(softSkills.map(s => ({
        name: s.skillName,
        level: s.proficiencyEstimation
      }))),
      DOMAIN_SKILLS: expandSlashSeparatedSkills(domainSkills.map(s => ({
        name: s.skillName,
        level: this.getSkillLabelFromNumeric(s.proficiencyEstimation),
        barWidth: this.getBarWidth(s.proficiencyEstimation)
      }))),
      MANAGERIAL_SKILLS: expandSlashSeparatedSkills(managerialSkills.map(s => ({
        name: s.skillName,
        level: s.proficiencyEstimation
      }))),
      LANGUAGES: languagesSkills.map(l => {
        const circumference = 2 * Math.PI * 36;
        const percentage = (l.proficiencyEstimation / 6) * 100;
        const dashoffset = circumference - (percentage / 100) * circumference;
        const bars = [];
        const maxLevel = 6;
        for (let i = 1; i <= maxLevel; i++) {
          bars.push({
            active: i <= l.proficiencyEstimation
          });
        }

        return {
          name: l.skillName,
          bars,
          level: this.mapProficiencyLevel(l.proficiencyEstimation),
          short: this.mapProficiencyLevel(l.proficiencyEstimation).slice(0, 3),
          barWidth: this.getBarWidth(l.proficiencyEstimation),
          circumference: Math.round(circumference * 100) / 100,
          dashoffset: Math.round(dashoffset * 100) / 100
        };
      }),
      CERTIFICATIONS: certification.map(c => ({
        name: c.skillName,
        issuer: c.certificationCenter,
        year: this.formatMonthYear(c.certificationDate)
      })),
      MOTIVATIONAL_FACTORS: (profile.preferences?.motivationalFactors?.map(m => softHyphenate(m.factor)) || [])
    };

    const renderedHtml = templateFn(context);
    return this.inlineCss(renderedHtml, css);
  }

  private inlineCss(html: string, css: string): string {
    const sanitizedHtml = html.replace(/<link\s+rel=["']stylesheet["'][^>]*>/gi, '');
    const styleTag = `<style>${css}</style>`;

    if (/<\/head>/i.test(sanitizedHtml)) {
      return sanitizedHtml.replace(/<\/head>/i, `${styleTag}</head>`);
    }

    return `${styleTag}${sanitizedHtml}`;
  }

  private async resolveImageSource(imageSource?: string | null): Promise<string | null> {
    if (!imageSource) {
      return null;
    }

    if (imageSource.startsWith('data:')) {
      return imageSource;
    }

    try {
      if (/^https?:\/\//i.test(imageSource)) {
        const response = await axios.get<ArrayBuffer>(imageSource, {
          responseType: 'arraybuffer',
        });

        const contentType = response.headers['content-type'] || this.getMimeTypeFromPath(imageSource);
        const base64 = Buffer.from(response.data).toString('base64');
        return `data:${contentType};base64,${base64}`;
      }

      const normalizedPath = path.isAbsolute(imageSource)
        ? imageSource
        : path.resolve(getBaseDir(), imageSource.replace(/^\//, ''));

      if (!fs.existsSync(normalizedPath)) {
        return imageSource;
      }

      const fileBuffer = fs.readFileSync(normalizedPath);
      const contentType = this.getMimeTypeFromPath(normalizedPath);
      return `data:${contentType};base64,${fileBuffer.toString('base64')}`;
    } catch (error) {
      console.warn(`⚠️ Could not inline CV image source: ${imageSource}`, error);
      return imageSource;
    }
  }

  private getMimeTypeFromPath(filePath: string): string {
    const extension = path.extname(filePath).toLowerCase();

    switch (extension) {
      case '.png':
        return 'image/png';
      case '.jpg':
      case '.jpeg':
        return 'image/jpeg';
      case '.webp':
        return 'image/webp';
      case '.gif':
        return 'image/gif';
      case '.svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }

  private applyColorTheme(css: string, colorTheme: string): string {
    const colorSets: Record<string, Record<string, string>> = {
      teal: {
        '--primary-color': '#008C94',
        '--primary-dark': '#037F8C',
        '--primary-bright': '#04D9D9',
      },
      orange: {
        '--primary-color': '#f97316',
        '--primary-dark': '#eb4d0fff',
        '--primary-bright': '#fb923c',
      },
      'dark-blue': {
        '--primary-color': '#1e3a8a',
        '--primary-dark': '#1e40af',
        '--primary-bright': '#3b82f6',
      },
    };

    const chosen = colorSets[colorTheme] || colorSets.orange;

    // Replace variables or append them at the end of :root
    const themeVars = Object.entries(chosen)
      .map(([key, val]) => `${key}: ${val};`)
      .join('\n');

    // Add or override inside :root
    if (!/:root\s*{[^}]*}/.test(css)) {
      return `:root {\n${themeVars}\n}\n${css}`;
    }

    return css.replace(/:root\s*{[^}]*}/, (match) => {
      return match.replace('}', `  ${themeVars}\n}`);
    });
  }

  private mapProficiencyLevel(level: number): string {
    const mapping: Record<number, string> = {
      0: 'A0',
      1: 'A1',
      2: 'A2',
      3: 'B1',
      4: 'B2',
      5: 'C1',
      6: 'C2',
    };
    return mapping[level] ?? '';
  }

  private formatMonthYear(date?: string | Date, isCurrent = false): string {
    if (isCurrent) {
      return 'Present';
    }

    if (!date) {
      return '';
    }

    return new Date(date).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  }

  private getSkillLabelFromNumeric(level: any): ProficiencyLevel {
    const numeric = resolveNumericLevel(level);
    return PROFICIENCY_LABEL_BY_NUMBER[numeric] ?? ProficiencyLevel.Beginner;
  }

  private getBarWidth(level: any): number {
    const numericLevel = resolveNumericLevel(level);

    const MAX_LEVEL = 7; 

    return (numericLevel / MAX_LEVEL) * 100;
  }

  private calculateYearsExperience(experiences: any[]): number {
    console.log('experiences', experiences);

    const MS_PER_DAY = 1000 * 60 * 60 * 24;
    const DAYS_IN_YEAR = 365.25;

    const today = new Date();

    const totalDays = experiences.reduce((acc, exp) => {
      if (!exp.startWorkDate) return acc;

      const start = new Date(exp.startWorkDate);

      // ⭐ business rule: isCurrent overrides endWorkDate
      const end =
        exp.isCurrent || !exp.endWorkDate
          ? today
          : new Date(exp.endWorkDate);

      const diffDays = Math.max(0, (end.getTime() - start.getTime()) / MS_PER_DAY);

      return acc + diffDays;
    }, 0);

    return Math.round((totalDays / DAYS_IN_YEAR) * 10) / 10;
  }

  private mapExperience(exp: any, i: number = 0) {
    const responsibilities = splitSingleStringArray(exp.resposiblities).flatMap(r => splitTextLines(r));
    const achievements = splitSingleStringArray(exp.achievements).flatMap(a => splitTextLines(a));

    return {
      title: exp.jobTitle,
      company: exp.companyName,
      period: `${this.formatMonthYear(exp.startWorkDate)} - ${this.formatMonthYear(
        exp.endWorkDate,
        exp.isCurrent
      )}`,
      responsibilities,
      description: softHyphenate(exp.resposiblities || ''),
      achievements,
      isBordered: i !== 0,
      isCurrent: !exp.endWorkDate || new Date(exp.endWorkDate) > new Date()
    };
  }
}

export const PROFICIENCY_LABEL_BY_NUMBER: Record<number, ProficiencyLevel> = {
  1: ProficiencyLevel.Beginner,
  2: ProficiencyLevel.Intern,
  3: ProficiencyLevel.Junior,
  4: ProficiencyLevel.Regular,
  5: ProficiencyLevel.Professional,
  6: ProficiencyLevel.Expert,
  7: ProficiencyLevel.Lead,
};

export const PROFICIENCY_ORDER: Record<ProficiencyLevel, number> = {
  [ProficiencyLevel.Beginner]: 1,
  [ProficiencyLevel.Intern]: 2,
  [ProficiencyLevel.Junior]: 3,
  [ProficiencyLevel.Regular]: 4,
  [ProficiencyLevel.Professional]: 5,
  [ProficiencyLevel.Expert]: 6,
  [ProficiencyLevel.Lead]: 7,
};

/**
 * Inserts soft hyphens (&shy; / \u00AD) into long words to enable better line breaking.
 * The soft hyphen is invisible unless the word needs to wrap, in which case it shows as a hyphen.
 * @param text - The text to process
 * @param minWordLength - Minimum word length before applying soft hyphens (default: 8)
 * @param chunkSize - Character interval for inserting soft hyphens (default: 4)
 */
function softHyphenate(
  text: string | null | undefined,
  minWordLength: number = 8,
  chunkSize: number = 4
): string {
  if (!text) {
    return '';
  }

  const SHY = '\u00AD'; // Soft hyphen character

  return text.replace(/\S+/g, (word) => {
    // Skip words shorter than threshold or already containing hyphens/soft-hyphens
    if (word.length < minWordLength || word.includes(SHY) || word.includes('-')) {
      return word;
    }

    // Insert soft hyphens at regular intervals
    const result: string[] = [];
    for (let i = 0; i < word.length; i += chunkSize) {
      result.push(word.slice(i, i + chunkSize));
    }

    return result.join(SHY);
  });
}

function resolveNumericLevel(level: any): number {
    if (typeof level === 'number') return level;

    if (typeof level === 'string') {
      if (!isNaN(Number(level))) {
        return Number(level);
      }

      // enum string like "Junior"
      return PROFICIENCY_ORDER[level as ProficiencyLevel] ?? 1;
    }

    return 1; // fallback → Beginner
  }

export function splitTextLines(
  text: string | string[] | null | undefined
): string[] {
  if (!text) {
    return [];
  }

  const source = Array.isArray(text) ? text.join('\n') : text;

  return source
    // normalize line breaks
    .replace(/\r\n/g, '\n')

    // soft hyphen (HTML + unicode)
    .replace(/&shy;|\u00AD/g, '\n')

    // list separators
    .replace(/;\s*/g, '\n')
    .replace(/\s*[•●▪◦‣⁃]+\s*/g, '\n')
    .replace(/\s+[–—]\s+/g, '\n')
    .replace(/\d+\.\s+/g, '\n')
    .replace(/,\s+(?=[A-ZА-ЯЁ])/g, '\n')

    // 👉 NEW: sentence splitting (safe heuristic)
    .replace(/([.!?])\s+(?=[A-ZА-ЯЁ0-9])/g, '$1\n')

    // remove list markers at line start
    .replace(/^\s*[-*]+\s+/gm, '')

    // split
    .split(/\n+/)

    // cleanup
    .map(line =>
      line
        .trim()
        .replace(/^[-–—*•●▪◦‣⁃]+\s*/, '')
        .trim()
    )

    .filter(Boolean);
}

/**
 * Splits skills that contain "/" into separate individual skills.
 * E.g., "Git / Git Flow / TFS / SVN" becomes ["Git", "Git Flow", "TFS", "SVN"]
 * Each split skill inherits the original skill's properties (level, barWidth, etc.)
 */
function expandSlashSeparatedSkills<T extends { name: string }>(skills: T[]): T[] {
  return skills.flatMap(skill => {
    if (!skill.name || !skill.name.includes('/')) {
      return [skill];
    }

    // Split by "/" and trim each part
    const splitNames = skill.name
      .split('/')
      .map(name => name.trim())
      .filter(name => name.length > 0);

    // Create a new skill object for each split name, inheriting all other properties
    return splitNames.map(name => ({
      ...skill,
      name
    }));
  });
}

function splitSingleStringArray(
  textArray: string[] | string | null | undefined,
  delimiter: string | RegExp = /\n+/
): string[] {
  if (!textArray) {
    return [];
  }

  // Ensure we have a single string combining all array elements
  const text = Array.isArray(textArray) ? textArray.join('\n') : textArray;

  return text
    .split(delimiter)                  // split by lines
    .map(line => line.trim())          // trim whitespace
    .filter(line => line.length > 0)   // remove empty lines
    .map(line => {
      // remove common bullet characters at the start
      return line.replace(/^(\s*[-*•]\s*|\d+\.\s*|[a-zA-Z]\)\s*)/, '');
    });
}