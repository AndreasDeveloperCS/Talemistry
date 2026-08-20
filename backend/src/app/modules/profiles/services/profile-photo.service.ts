import {
  Injectable
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { ProfilePhoto, ProfilePhotoDocument } from '../models/profile-photo';
import { ObjectId } from 'bson';

@Injectable()
export class ProfilePhotoService extends BaseService<ProfilePhoto> {
  private folderName: string = "profile-photo";

  constructor(
    @InjectModel(ProfilePhoto.name)
    protected readonly model: Model<ProfilePhotoDocument>,

    @InjectRepository(ProfilePhoto)
    protected readonly repository: Repository<ProfilePhoto>,

    private AWSFileShareService: AWSFileShareService
  ) {
    super(model, repository)
  }

  public async deleteOldPhoto(userId: ObjectId | string): Promise<any> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const oldPhoto = await this.repository.findOne({
      where: {
        userId: userIdObj,
        isMain: true
      }
    });
    if (oldPhoto != null) {

      const result = await this.AWSFileShareService.deleteFile(oldPhoto.Key);
      if (result != null) {
        await this.repository.delete(oldPhoto._id);
      }
    }
    return oldPhoto;
  }

  public async getProfilePhoto(userId: ObjectId | string): Promise<ProfilePhoto[]> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const profilePhoto = await this.repository.find({
      where: {
        userId: userIdObj,
        isMain: true
      }
    });
    console.log('Profile photo', profilePhoto);
    return profilePhoto;
  }

  public async getProfilePhotoById(userId: ObjectId | string): Promise<ProfilePhoto> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const profilePhoto = await this.repository.findOne({
      where: {
        userId: userIdObj,
        isMain: true
      }
    });
    return profilePhoto;
  }

  public async profilePhotoOneUpload(file: Express.Multer.File, userId: ObjectId | string): Promise<ProfilePhoto[]> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const awsResult: any = await this.AWSFileShareService.uploadFile(this.folderName, file, userId.toString());
    console.log('resultPhoto', awsResult);
    const presignedUrl = await this.AWSFileShareService.getPresignedUrl(awsResult.Key);
    const entity: ProfilePhoto = {
      userId: userIdObj,
      isMain: true,
      Bucket: awsResult.Bucket,
      ETag: awsResult.ETag,
      Key: awsResult.Key,
      presignedUrl: presignedUrl,
      imagePath: awsResult.Location,
      Location: awsResult.Location,
      mimetype: file.mimetype,
      size: file.size,
      originalName: file.originalname,
      createdDate: new Date(),
      sharedReadIds: [],
      sharedReadEmails: [],
      createdBy: userIdObj
    };
    const result = await this.createAsync(entity);
    return [result]
  };

  public async profilePhotoMultipleUpload(files: Express.Multer.File[], userId: ObjectId | string): Promise<ProfilePhoto[]> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const uploadPromises = files.map(async (file: Express.Multer.File) => {
      const awsResult: any = await this.AWSFileShareService.uploadFile(this.folderName, file, userId.toString());
      const presignedUrl = await this.AWSFileShareService.getPresignedUrl(awsResult.Key);
      const entity: ProfilePhoto = {
        userId: userIdObj,
        isMain: true,
        Bucket: awsResult.Bucket,
        ETag: awsResult.ETag,
        Key: awsResult.Key,
        presignedUrl: presignedUrl,
        imagePath: awsResult.Location,
        Location: awsResult.Location,
        mimetype: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        createdDate: new Date(),
        sharedReadIds: [],
        sharedReadEmails: [],
        createdBy: userIdObj
      };
      return await this.createAsync(entity);
    });

    return Promise.all(uploadPromises);
  }

  public async getMainPhotoURL(userId: ObjectId | string): Promise<string | null> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

    const photo = await this.model.findOne(
      { userId: userIdObj, isMain: true },
      { Location: 1, imagePath: 1, _id: 0 }
    ).lean();

    if (!photo) {
      return null;
    }

    return photo.Location ?? photo.imagePath ?? null;
  }

  public async getMainPhotoURLMap(userIds: ObjectId[]): Promise<Map<string, string>> {
    if (!userIds.length) {
      return new Map();
    }

    const rows = await this.model.aggregate([
      { $match: { userId: { $in: userIds }, isMain: true } },
      { $sort: { createdDate: -1 } },
      { $group: { _id: '$userId', doc: { $first: '$$ROOT' } } },
      {
        $project: {
          _id: 1,
          url: { $ifNull: ['$doc.Location', '$doc.imagePath'] },
        },
      },
    ]).exec();

    const map = new Map<string, string>();
    for (const r of rows) {
      if (r.url) {
        map.set(String(r._id), r.url);
      }
    }
    return map;
  }
}