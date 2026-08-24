import { Injectable } from '@nestjs/common';
import { Skill, SkillDocument, SkillType } from '../models/skill';
import { BaseService } from '../../base/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';

@Injectable()
export class SkillsService extends BaseService<Skill> {


  constructor(
    @InjectModel(Skill.name)
    protected readonly model: Model<SkillDocument>,

    @InjectRepository(Skill)
    protected readonly repository: Repository<Skill>
  ) {
    super(model, repository);
  }

  async isExisting(entity: Skill) {
    const current = await this.findByMultipleFields({
      skillName: entity.skillName,
      skillType: entity.skillType
    })
    return !!current;
  }

}