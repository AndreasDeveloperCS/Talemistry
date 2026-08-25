import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { get } from 'http';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { EmptyModel } from '../../base/models/empty-model';

@Injectable()
export class GeminiService extends BaseService<any> {

  private readonly apiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-002:generateContent';
  private readonly imageApiUrl = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash-001:generateContent';
  private readonly apiKey = process.env.GEMINI_API_KEY!;
  private readonly projectNumber = '491769735377';


  constructor(
    @InjectModel(EmptyModel.name)
    protected readonly model: Model<any>,

    @InjectRepository(EmptyModel)
    protected readonly repository: Repository<any>

  ) {
    super(model, repository);
  }

  async getModels(): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}?key=${this.apiKey}`);
      // console.log('Models:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error getting models:', error.response?.data || error.message);
    }
  }

  async generateArticleWithImage(topic: string): Promise<any> {
    // console.log('Service Gemini');
    // await this.getModels();
    try {
      // Step 1: Generate Article
      const textResponse = await axios.post(`${this.apiUrl}?key=${this.apiKey}`, {
        contents: [{ role: 'user', parts: [{ text: `Write a detailed blog article about ${topic}.` }] }]
      });

      const article = textResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No article generated.';

      // Step 2: Generate Image
      const imageResponse = await axios.post(`${this.imageApiUrl}?key=${this.apiKey}`, {
        contents: [{ role: 'user', parts: [{ text: `Generate an image related to ${topic}.` }] }]
      });

      const imageUrl = imageResponse.data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
      // console.log('Article:', article);
      // console.log('Image URL:', imageUrl);

      return { article, imageUrl };
    } catch (error: any) {
      console.error('Error generating content:', error.response?.data || error.message);
    }
  }
}