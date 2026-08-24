import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { PositionLiked, PositionLikedDocument } from '../models/position-liked';

@Injectable()
export class PositionsLikedService extends BaseService<PositionLiked>{

    constructor(
        @InjectModel(PositionLiked.name)
        protected readonly model: Model<PositionLikedDocument>,
    
        @InjectRepository(PositionLiked)
        protected readonly repository: Repository<PositionLiked>
    ) {
        super(model, repository);
    }

    async likePosition(userId: ObjectId, positionId: ObjectId): Promise<PositionLiked> {
        const result = await this.model.findOneAndUpdate(
            { 
                userId: new ObjectId(userId) 
            },
            { 
                $addToSet: { 
                    positionsLiked: new ObjectId(positionId) 
                }, 
                $set: { 
                    modifiedDate: new Date(), 
                    modifiedBy: new ObjectId(userId) 
                },
                $setOnInsert: {
                    createdDate: new Date(),
                    createdBy: new ObjectId(userId),
                    userId: new ObjectId(userId),
                    isVerified: true,
                },
            },
            { new: true, upsert: true }
        );
        const all = await this.getLikedPositionIds(userId);
        console.log('likePosition, all', all);
        return result;
    }

    async unlikePosition(userId: ObjectId, positionId: ObjectId): Promise<PositionLiked> {
        const result = await this.model.findOneAndUpdate(
            { 
                userId: new ObjectId(userId) 
            },
            { 
                $pull: { 
                    positionsLiked: new ObjectId(positionId) 
                }, 
                $set: { 
                    modifiedDate: new Date(), 
                    modifiedBy: new ObjectId(userId) 
                },
            },
            { new: true }
        );
        const all = await this.getLikedPositionIds(userId);
        console.log('unlikePosition, all', all);
        return result;
    }

    async getLikedPositionIds(userId: ObjectId): Promise<any[]> {
        console.log('getLikedPositionIds', userId);
        const likedPositions = await this.model.findOne({ userId: new ObjectId(userId) });
        if (!likedPositions || !likedPositions.positionsLiked) {
            return [];
        }
        console.log('likedPositions', likedPositions);
        return likedPositions.positionsLiked;
    }
}