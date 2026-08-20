import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { BaseService } from '../../base/services/base.service';
import { CompanyLogo, CompanyLogoDocument } from '../models/company-logos';
import { CompanyData } from '../models/company-data';

@Injectable()
export class CompanyLogosService extends BaseService<CompanyLogo>{
  private publicImagePathPrefix: string = 'https://d6nrcrbzehdnr.cloudfront.net';
  private folderName: string = "company-logos";

  constructor(
    @InjectModel(CompanyLogo.name)
    protected readonly model: Model<CompanyLogoDocument>,

    @InjectRepository(CompanyLogo)
    protected readonly repository: Repository<CompanyLogo>,

    private AWSFileShareService: AWSFileShareService
  ) {
    super(model, repository);
  }

  public async uploadCompanyLogo(file: Express.Multer.File, userId: ObjectId): Promise<CompanyLogo> {
    const awsResult: any = await this.AWSFileShareService.uploadFile(this.folderName, file, this.folderName);
    const presignedUrl = await this.AWSFileShareService.getPresignedUrl(awsResult.Key);

    console.log('uploadcompanyLogo', awsResult, presignedUrl, this.publicImagePathPrefix);

    const companyLogoEntity: CompanyLogo = {
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

    const result = await this.createAsync(companyLogoEntity);
    console.log('uploadcompanyLogo result', result);
    return result;
  }

  public async updateCompanyLogo(file: Express.Multer.File, userId: ObjectId, existingCL: CompanyLogo)
  : Promise<CompanyLogo> {
    const uploaded = await this.uploadCompanyLogo(file, userId);

    if (existingCL?.Key) {
      const deleteResult = await this.deleteOldPhoto(existingCL);
    }
    return uploaded;
  }

  public async deleteOldPhoto(existingCL: CompanyLogo): Promise<any> {
    const oldPhoto = await this.repository.findOne({
      where: {
        Key: existingCL?.Key,
      }
    });
    
    if (oldPhoto != null) {

      const result = await this.AWSFileShareService.deleteFile(oldPhoto.Key);
      if (result != null) {
        const deleteResult = await this.repository.delete(oldPhoto._id);
        
        console.log('updateCompanyLogo deleteResult', deleteResult);
      }
    }
    
    return oldPhoto;
  }
}