import {
  Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { BlogPost, BlogPostDocument } from '../models/blog-post';

@Injectable()
export class BlogService extends BaseService<BlogPost>
{
  constructor(
    @InjectModel(BlogPost.name)
    protected readonly model: Model<BlogPostDocument>,

    @InjectRepository(BlogPost)
    protected readonly repository: Repository<BlogPost>

  ) {
    super(model, repository);
  }
}
  
  