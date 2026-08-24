import { ObjectId } from 'bson';
import { Injectable } from '@nestjs/common';
import { Interview, InterviewDocument } from '../model/interview';
import { Condition, Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class InterviewService extends BaseService<Interview> {

  collectionName = 'interviews';

  constructor(
    @InjectModel(Interview.name)
    protected readonly model: Model<InterviewDocument>,

    @InjectRepository(Interview)
    protected readonly repository: Repository<Interview>
  ) {
    super(model, repository);
  }

  async getByPositionId(positionId: string): Promise<Interview[]> {
    try {
      // Try MongoDB first
      const mongoResult = await this.model.find({ positionId: positionId }).exec();
      if (mongoResult && mongoResult.length > 0) {
        return mongoResult;
      }
      
      // Fallback to TypeORM
      return await this.repository.find({ where: { positionId: positionId } });
    } catch (error) {
      console.error('Error getting interviews by positionId:', error);
      return [];
    }
  }
}
