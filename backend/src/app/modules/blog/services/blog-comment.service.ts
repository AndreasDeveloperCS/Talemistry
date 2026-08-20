import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { BlogPostComment, BlogPostCommentDocument } from '../models/blog-comment';

@Injectable()
export class BlogPostCommentService extends BaseService<BlogPostComment>
{
    constructor(
    @InjectModel(BlogPostComment.name)
    protected readonly model: Model<BlogPostCommentDocument>,

    @InjectRepository(BlogPostComment)
    protected readonly repository: Repository<BlogPostComment>

  ) {
    super(model, repository);
  }

  async findCommentsByBlogPost(blogPostId: any): Promise<any[]> {
    console.log('findCommentsByBlogPost');
    
    const blogPostComments = await this.model
      .find({ blogPostId })
      .sort({ createdDate: 1 })
      .exec();

    console.log('Found comments:', blogPostComments);
    return blogPostComments;
  }

  async addBlogPostComment(commentData: Partial<any>): Promise<any> {
    console.log('commentData', commentData);
    const newComment = new this.model(commentData);
    console.log('newComment', newComment);
    return newComment.save();
  }

  async deleteComment(commentId: any): Promise<{ deleted: boolean }> {
    const result = await this.model.deleteOne({ _id: commentId }).exec();

    return { deleted: result.deletedCount === 1 };
  }

  // For a chain of comments if parentComment is deleted
  async deleteCommentWithChildren(commentId: string): Promise<void> {
    const children = await this.model.find({ parentId: commentId });

    // Recursively delete child comments
    for (const child of children) {
      await this.deleteCommentWithChildren(child._id.toString());
    }

    await this.model.deleteOne({ _id: commentId }).exec();
  }
}