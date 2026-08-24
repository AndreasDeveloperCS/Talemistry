import { Service } from 'typedi';
import { BaseService } from '../../base/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { LiveCodingSession, LiveCodingSessionDocument } from '../models/live-coding-session.model';

@Service()
export class LiveCodingSessionService extends BaseService<LiveCodingSession> {

  constructor(
    @InjectModel(LiveCodingSession.name)
    protected readonly model: Model<LiveCodingSessionDocument>,

    @InjectRepository(LiveCodingSession)
    protected readonly repository: Repository<LiveCodingSession>
  ) {
    super(model, repository);
  }

}