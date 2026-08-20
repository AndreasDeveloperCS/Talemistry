import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { BaseService } from '../../base/services/base.service';
import { SocialMedia } from '../models/social-media';
import { SocialMediaIcon, SocialMediaIconDocument } from '../models/social-media-icon';

@Injectable()
export class SocialMediaIconService extends BaseService<SocialMediaIcon>{
  private publicImagePathPrefix: string = 'https://d6nrcrbzehdnr.cloudfront.net';
  private folderName: string = "social-media-icons";

  constructor(
    @InjectModel(SocialMediaIcon.name)
    protected readonly model: Model<SocialMediaIconDocument>,

    @InjectRepository(SocialMediaIcon)
    protected readonly repository: Repository<SocialMediaIcon>,

    private AWSFileShareService: AWSFileShareService
  ) {
    super(model, repository);
  }

  public async uploadSocialMediaIcon(file: Express.Multer.File, userId: ObjectId): Promise<SocialMediaIcon> {
    const awsResult: any = await this.AWSFileShareService.uploadFile(this.folderName, file, this.folderName);
    const presignedUrl = await this.AWSFileShareService.getPresignedUrl(awsResult.Key);

    console.log('socialMediaIconUpload', awsResult, presignedUrl, this.publicImagePathPrefix);

    const socialMediaIconEntity: SocialMediaIcon = {
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
      userId: new ObjectId(userId)
    };

    const result = await this.createAsync(socialMediaIconEntity);
    console.log('uploadSocialMediaIcon result', result);
    return result;
  }

  public async updateSocialMediaIcon(file: Express.Multer.File, userId: ObjectId, existingSM: SocialMedia)
  : Promise<SocialMediaIcon> {
    const uploaded = await this.uploadSocialMediaIcon(file, userId);

    if (existingSM?.Key) {
      const deleteResult = await this.deleteOldPhoto(existingSM);
    }
    return uploaded;
  }

  public async deleteOldPhoto(existingSM: SocialMedia): Promise<any> {
    const oldPhoto = await this.repository.findOne({
      where: {
        Key: existingSM?.Key,
      }
    });
    
    if (oldPhoto != null) {

      const result = await this.AWSFileShareService.deleteFile(oldPhoto.Key);
      if (result != null) {
        const deleteResult = await this.repository.delete(oldPhoto._id);
        
        console.log('updateSocialMediaIcon deleteResult', deleteResult);
      }
    }
    
    return oldPhoto;
  }
}