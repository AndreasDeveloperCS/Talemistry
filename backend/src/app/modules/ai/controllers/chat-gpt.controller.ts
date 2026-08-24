import {
  Body, Controller,
  Post,
  Query, Req, Res,
  SetMetadata
} from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { BaseController } from '../../base/controllers/base.controller';
import { EmptyModel } from '../../base/models/empty-model';
import { ChatGptService } from '../services/chat-gpt.service';

@Controller('chat-gpt')
@SetMetadata('entityModel', EmptyModel)
export class ChatGptController extends BaseController<any> {

  override className = this.constructor.name;
  
  constructor(
    private readonly chatgptService: ChatGptService,
    protected moduleRef: ModuleRef) {
    super(chatgptService, moduleRef);
  }

  @Post('generate-content')
  async generate(
    @Query('topic') topic: string, 
    @Query('isImageNeeded') isImageNeeded: boolean): 
    Promise<any> {
    console.log('Controller Received Parameters - topic:', topic, ', isImageNeeded:', isImageNeeded);
    try {
      const result = await this.chatgptService.generateContent(topic, isImageNeeded);
      console.log('Controller Generated Result:', result);
      return result;
    } catch (error) {
      throw new Error('Failed to generate content: ' + error.message);
    }
  }

  @Post('generate-open-position')
  async generateOpenPosition(
    @Body() payload: any,
    @Req() request: any,
    @Res() response: any
  ): Promise<any> {
    console.log('Controller ChatGpt Received Payload', payload);
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const result = await this.chatgptService.generateOpenPosition(payload);
      console.log('Controller ChatGpt Generated Result:', result);
      return response.status(200).send(result);
    } catch (error) {
      console.error('Failed to generate open position: ' + error);
      return response.status(500).send(error);
    }
  }
}