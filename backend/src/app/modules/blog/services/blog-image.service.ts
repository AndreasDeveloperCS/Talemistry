import {
  Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { BlogImage, BlogImageDocument } from '../models/blog-image';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { ObjectId } from 'bson';

@Injectable()
export class BlogImageService extends BaseService<BlogImage> {

  private publicImagePathPrefix: string = 'https://d6nrcrbzehdnr.cloudfront.net';
  private folderName: string = "evryka-blog-post-images";

  constructor(
    @InjectModel(BlogImage.name)
    protected readonly model: Model<BlogImageDocument>,

    @InjectRepository(BlogImage)
    protected readonly repository: Repository<BlogImage>,

    private AWSFileShareService: AWSFileShareService
  ) {
    super(model, repository)
  }

  public async uploadBlogImages(files: Express.Multer.File[], blogId: any, userId: ObjectId): Promise<BlogImage[]> {

    const uploadPromises = files.map(async (file: Express.Multer.File) => {
      return await this.uploadBlogImage(file, blogId, userId);
    });

    return Promise.all(uploadPromises);
  }


  public async uploadBlogImage(file: Express.Multer.File, blogId: any, userId: ObjectId): Promise<BlogImage> {
    const awsResult: any = await this.AWSFileShareService.uploadFile(this.folderName, file, blogId);
    const presignedUrl = await this.AWSFileShareService.getPresignedUrl(awsResult.Key);

    console.log('blogImageUpload', awsResult, presignedUrl, this.publicImagePathPrefix);

    const blogPostEntity: BlogImage = {
      internalBlogId: new ObjectId(blogId),
      Bucket: awsResult.Bucket,
      ETag: awsResult.ETag,
      Key: awsResult.Key,
      presignedUrl: presignedUrl,
      imagePath: `${this.publicImagePathPrefix}/${awsResult.Key}`,
      Location: awsResult.Location,
      mimetype: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      createdBy: new ObjectId(userId),
      createdDate: new Date(),
      isVerified: false,
      userId: new ObjectId(userId),
      sharedReadIds: [],
      sharedReadEmails: [],
      sharedEditIds: [],
      sharedEditEmails: []
    };

    const result = await this.createAsync(blogPostEntity);
    return result;
  }
}