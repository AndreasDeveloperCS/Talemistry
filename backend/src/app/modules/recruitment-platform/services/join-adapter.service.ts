import axios from 'axios';
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { EmptyDocument, EmptyModel } from '../../base/models/empty-model';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class JoinAdapterService extends BaseService<EmptyModel> {
    private readonly API_URL = 'https://api.join.com/v2';
    private readonly API_TOKEN = process.env.JOIN_API_TOKEN || 'your_api_token_here';

    constructor(
        @InjectModel(EmptyModel.name)
        protected readonly model: Model<EmptyDocument>,

        @InjectRepository(EmptyModel)
        protected readonly repository: Repository<EmptyModel>
    ) {
        super(model, repository);
    }

    async getAllJobs() {
        try {
            const response = await axios.get(`${this.API_URL}/jobs`, {
                headers: {
                    Authorization: `Bearer ${this.API_TOKEN}`,
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error getting jobs:', error.response?.status, JSON.stringify(error.response?.data, null, 2));
            throw new HttpException(error.response?.data || 'Failed to fetch jobs', error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async createJob(jobData: any) {
        try {
            const response = await axios.post(`${this.API_URL}/jobs`, jobData, {
                headers: {
                    Authorization: `Bearer ${this.API_TOKEN}`,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });
            return response.data;
        } catch (error) {
            console.error('Error creating job:', error.response?.status, JSON.stringify(error.response?.data, null, 2));
            throw new HttpException(error.response?.data || 'Failed to create job', error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
}
