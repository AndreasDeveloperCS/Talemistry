import { Controller, Get, Query, SetMetadata } from '@nestjs/common';
import { GeminiService } from '../services/gemini.service';
import { EmptyModel } from '../../base/models/empty-model';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';

@Controller('gemini')
@SetMetadata('entityModel', EmptyModel)
export class GeminiController extends BaseController<any> {
  override className = this.constructor.name;
  constructor(private readonly geminiService: GeminiService, protected moduleRef: ModuleRef) {
    super(geminiService, moduleRef);
  }

  @Get('generate')
  async generate(@Query('topic') topic: string): Promise<any> {
    try {
      const result = await this.geminiService.generateArticleWithImage(topic);
      return result;
    } catch (error) {
      throw new Error('Failed to generate article and images');
    }
  }
}