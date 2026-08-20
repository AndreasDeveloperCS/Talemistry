import { Module } from '@nestjs/common';
import { PresentationContentController } from './controllers/presentation-content.controller';

@Module({
  controllers: [PresentationContentController]
})
export class PresentationContentModule { }
