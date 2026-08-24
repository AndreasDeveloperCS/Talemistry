import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { BlogFavorite, BlogFavoriteDocument } from '../models/blog-favorite';

@Injectable()
export class BlogsFavoriteService extends BaseService<BlogFavorite> {

    constructor(
        @InjectModel(BlogFavorite.name)
        protected readonly model: Model<BlogFavoriteDocument>,

        @InjectRepository(BlogFavorite)
        protected readonly repository: Repository<BlogFavorite>
    ) {
        super(model, repository);
    }

    async addBlogToFavorite(userId: ObjectId, blogId: ObjectId): Promise<BlogFavorite> {
        const result = await this.model.findOneAndUpdate(
            { userId },
            {
                $addToSet: { blogsFavorite: blogId },
                $set: { modifiedDate: new Date(), modifiedBy: userId }
            },
            { new: true, upsert: true }
        );
        const all = await this.getFavoriteBlogsIds(userId);
        console.log('addBlogToFavorite, all', all);
        return result;
    }

    async removeBlogFromFavorite(userId: ObjectId, blogId: ObjectId): Promise<BlogFavorite> {
        const result = await this.model.findOneAndUpdate(
            { userId },
            {
                $pull: { blogsFavorite: blogId },
                $set: { modifiedDate: new Date() }
            },
            { new: true }
        );
        const all = await this.getFavoriteBlogsIds(userId);
        console.log('removeBlogFromFavorite, all', all);
        return result;
    }

    async getFavoriteBlogsIds(userId: ObjectId): Promise<any[]> {
        const favoriteBlogs = await this.model.findOne({ userId });
        if (!favoriteBlogs || !favoriteBlogs.blogsFavorite) {
            return [];
        }
        console.log('favoriteBlogs', favoriteBlogs);
        return favoriteBlogs.blogsFavorite;
    }
}