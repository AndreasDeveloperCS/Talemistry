import { Service } from 'typedi';
import { BaseService } from '../../base/services/base.service';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { CodeSnippet, CodeSnippetDocument } from '../models/code-snippet.model';

@Service()
export class CodeSnippetService extends BaseService<CodeSnippet> {

  constructor(
    @InjectModel(CodeSnippet.name)
    protected readonly model: Model<CodeSnippetDocument>,

    @InjectRepository(CodeSnippet)
    protected readonly repository: Repository<CodeSnippet>
  ) {
    super(model, repository);
  }

}