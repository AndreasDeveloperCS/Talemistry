import { ProficiencyLevel } from "../../skills/models/skill";
import { PROFICIENCY_ORDER } from "../models/cv-data-template";

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

export function resolveNumericLevel(level: ProficiencyLevel | number | string): number {
  // already a number
  if (typeof level === 'number') {
    return level;
  }

  // string number like "3"
  if (typeof level === 'string' && !isNaN(Number(level))) {
    return Number(level);
  }

  // string enum like "Junior"
  return PROFICIENCY_ORDER[level as ProficiencyLevel] ?? 0;
}