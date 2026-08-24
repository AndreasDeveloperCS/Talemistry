import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { PositionTag, QuestionCategory, ScreeningQuestionTemplate, ScreeningQuestionTemplateDocument, SeniorityLevel } from '../models/screening-question-template';

@Injectable()
export class ScreeningQuestionTemplatesService extends BaseService<ScreeningQuestionTemplate> {

    constructor(
        @InjectModel(ScreeningQuestionTemplate.name)
        protected readonly model: Model<ScreeningQuestionTemplateDocument>,

        @InjectRepository(ScreeningQuestionTemplate)
        protected readonly repository: Repository<ScreeningQuestionTemplate>
    ) {
        super(model, repository);
    }

    async getTemplatesByPositionTitle(positionTitle: string, limit: number): Promise<ScreeningQuestionTemplate[]> {
      const { positionTag, seniority } = parsePositionTitle(positionTitle);

      const templates = await this.model.find();

      console.log('Templates fetched:', templates);

      const scored = templates
        .map(template => ({
          template,
          score: scoreTemplate(template, positionTag, seniority),
        }))
        .filter(item => item.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map(item => item.template);

      return scored;
    }
}

// position-parser.util.ts
export function parsePositionTitle(title: string): {
  positionTag: PositionTag;
  seniority: SeniorityLevel | null;
} {
  const normalized = title.toLowerCase();

  let seniority: SeniorityLevel | null = null;

  if (normalized.includes('junior')) {
    seniority = SeniorityLevel.Junior;
  }
  else if (normalized.includes('middle') || normalized.includes('mid')) {
    seniority = SeniorityLevel.Middle;
  }
  else if (normalized.includes('senior')) {
    seniority = SeniorityLevel.Senior;
  }
  else if (normalized.includes('lead')) {
    seniority = SeniorityLevel.Lead;
  }

  let positionTag: PositionTag = PositionTag.General;

  if (normalized.includes('frontend')) {
    positionTag = PositionTag.Frontend;
  }
  else if (normalized.includes('backend')) {
    positionTag = PositionTag.Backend;
  }
  else if (normalized.includes('fullstack')) {
    positionTag = PositionTag.Fullstack;
  }
  else if (normalized.includes('qa')) {
    positionTag = PositionTag.QA;
  }
  else if (normalized.includes('devops')) {
    positionTag = PositionTag.DevOps;
  }
  else if (normalized.includes('mobile')) {
    positionTag = PositionTag.Mobile;
  }

  return { positionTag, seniority };
}

export function scoreTemplate(
  template: ScreeningQuestionTemplate,
  position: PositionTag,
  seniority: SeniorityLevel | null
): number {
  let score = 0;

  if (template.positionTags.includes(position)) {
    score += 5;
  }
  if (seniority && template.seniorityLevels.includes(seniority)) {
    score += 3;
  }

  // Generic templates penalty
  if (template.positionTags.length === Object.values(PositionTag).length) {
    score -= 1;
  }

  // Leadership bonus
  if (
    [SeniorityLevel.Senior, SeniorityLevel.Lead].includes(seniority!) &&
    template.category === QuestionCategory.Leadership
  ) {
    score += 2;
  }

  return score;
}