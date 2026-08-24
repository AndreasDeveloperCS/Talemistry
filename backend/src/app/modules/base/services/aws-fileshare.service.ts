import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
  PutObjectCommandOutput,
} from '@aws-sdk/client-s3';
import { Readable as NodeReadable } from 'stream';
import { getSignedUrl as getAWSSignedUrl } from "@aws-sdk/s3-request-presigner";
import process from 'process';

@Injectable()
export class AWSFileShareService {
  private readonly distributionDomainName = 'd6nrcrbzehdnr.cloudfront.net';
  // private readonly s3: AWS.S3;
  private readonly bucketName: string;
  private readonly s3Client: S3Client;

  constructor() {
    this.bucketName = process.env.AWS_BUCKET_NAME;
    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    entityFolderName: string,
    file: Express.Multer.File,
    folder: string,
    definedFileName?: string
  ): Promise<{ key: string;[key: string]: any }> {
    const fileName = definedFileName || file.originalname;

    const key = `${entityFolderName}/${folder}/${fileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      Metadata: {
        lastModified: new Date().toISOString(),
      },
    });

    try {
      const result: PutObjectCommandOutput = await this.s3Client.send(command);
      console.log('PutObjectCommandOutput', result);

      await this.getListOfFilesInFolder(entityFolderName, folder); // just to sync file list

      return {
        key: key,
        Key: key,
        Bucket: this.bucketName,
        ETag: result.ETag,
        Location: `https://${this.distributionDomainName}/${key}`,
        presignedUrl: await this.getPresignedUrlAsync(key),
        mimetype: file.mimetype,
        size: file.size,
        originalName: file.originalname,
        createdDate: new Date(),
        ...result,
      };
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    }
  }

  async getFile(key: string): Promise<NodeReadable> {
    console.log('AWS KEY', key);
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const { Body } = await this.s3Client.send(command);
      return Body as NodeReadable;
    } catch (error) {
      console.error('Get file error:', error);
      throw error;
    }
  }
  async getSignedUrl(key: string): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const url = await getAWSSignedUrl(this.s3Client, command, {
        expiresIn: 60 * 60 * 24 * 7 - 1, // effectively never expires (100 years)
      });

      return url;
    } catch (error) {
      console.error('Generate signed URL error:', error);
      throw error;
    }
  }

  async getPresignedUrlAsync(key: string): Promise<string> {
    return this.getSignedUrl(key); // alias for same behavior
  }

  async getPresignedUrl(key: string): Promise<string> {
    return this.getSignedUrl(key); // alias for same behavior
  }

  async deleteFile(key: string): Promise<boolean> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      console.error('Delete file error:', error);
      throw error;
    }
  }

  async getListOfFilesInFolder(folderPrefix: string, folderName: string): Promise<string[]> {
    const prefix = `${folderPrefix}/${folderName}`.replace(/\/+$/, '') + '/';
    const keys: string[] = [];

    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: this.bucketName,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await this.s3Client.send(command);

      if (response.Contents) {
        for (const item of response.Contents) {
          if (item.Key) keys.push(item.Key);
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
  }

  //---------------------------------------------------------------------



  // async uploadFileOld(entityFolderName: string,
  //   file: Express.Multer.File,
  //   folder: string,
  //   definedFileName: string = undefined): Promise<AWS.S3.ManagedUpload.SendData> {

  //   if (!definedFileName) {
  //     definedFileName = file.originalname
  //     //Buffer.from(file.originalname.normalize('NFKD'), 'utf8').toString();
  //   }
  //   //console.log('definedFileName', definedFileName);

  //   const metadata: Metadata = {
  //     lastModified: new Date().toISOString()
  //   }

  //   try {
  //     const params: AWS.S3.PutObjectRequest = {
  //       Bucket: this.bucketName,
  //       Key: `${entityFolderName}/${folder}/${definedFileName}`,
  //       // Body: fs.createReadStream(file.path),
  //       Body: file.buffer,

  //       ContentType: file.mimetype,
  //       Metadata: metadata,
  //       //ContentEncoding: 'utf8', 
  //       //ACL: 'public-read', // Access Control
  //     };


  //     const options: AWS.S3.ManagedUpload.ManagedUploadOptions = {
  //       params: params
  //     }

  //     const result = await this.s3.upload(params, options, this.handleFileUploadingCallback).promise();

  //     const fileList = await this.getListOfFilesInFolder(entityFolderName, folder)
  //     //console.log('file List', fileList);

  //     return result;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  // handleFileUploadingCallback(error: Error, data: AWS.S3.ManagedUpload.SendData) {
  //   // console.log(data.Bucket, data.ETag, data.Key, data.Location);
  //   console.error(error);
  // }

  // async getFileObjectOld(key: string): Promise<AWS.S3.GetObjectOutput> {
  //   try {
  //     const params = {
  //       Bucket: this.bucketName,
  //       Key: key,
  //     };

  //     const result = await this.s3.getObject(params).promise();

  //     // console.log(result);
  //     return result;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  // getSignedUrlOld(key: string): string {
  //   try {
  //     const params = {
  //       Bucket: this.bucketName,
  //       Key: key,
  //       Expires: 60 * 60 * 24 * 365 * 100, // URL expiration time in seconds
  //     };

  //     return this.s3.getSignedUrl('getObject', params);
  //   } catch (error) {
  //     console.error(error);
  //   }

  // }

  // async deleteFileOld(key: string): Promise<Readable> {
  //   try {
  //     const params: AWS.S3.GetObjectRequest = {
  //       Bucket: this.bucketName,
  //       Key: key,
  //     };

  //     const result = await this.s3.deleteObject(params).createReadStream();

  //     return result;
  //   } catch (error) {
  //     console.error(error);
  //   }
  // }

  // async getObjectBasedOnDDN(key: string) {

  // }

  // async getPresignedUrlAsync(key: string): Promise<string> {
  //   try {
  //     const url = await this.s3.getSignedUrlPromise('getObject', {
  //       Bucket: this.bucketName,
  //       Key: key,
  //       Expires: 604800, // 7 days
  //       ResponseExpires: new Date('2201-01-11T22:00:00Z') // optional, safe
  //     });
  //     return url;
  //   } catch (err) {
  //     console.error('Error generating pre-signed URL:', err);
  //     throw err;
  //   }
  // }
  // async getPresignedUrlOld(key: string) {
  //   console.log('getPresignedUrl', key);
  //   const params: AWS.S3.GetObjectRequest = {
  //     Bucket: this.bucketName,
  //     Key: key,
  //     // URL expiration time in seconds
  //     // ExpectedBucketOwner: '396545118415',
  //     // ResponseExpires: new Date(2099, 10, 10, 10, 10, 10)
  //   };

  //   try {
  //     const result = await this.s3.getSignedUrlPromise('getObject', {
  //       ...params,
  //       Expires: 3600 * 24 * 7, // URL expiration time in seconds
  //     });
  //     console.log('getPresignedUrl', result);
  //     return result;
  //   } catch (err) {
  //     console.error('Error generating pre-signed URL:', err);
  //   }
  // }
  // async getFile(key: string): Promise<Readable> {
  //   try {
  //     const params: AWS.S3.GetObjectRequest = {
  //       Bucket: this.bucketName,
  //       Key: key,
  //     };
  //     // console.log('getFile', params);
  //     const result = await this.s3.getObject(params).createReadStream();
  //     // console.log(result);
  //     return result;
  //   } catch (err) {
  //     console.error('Error generating pre-signed URL:', err);
  //   }
  // }

  // async getListOfFilesInFolderOld(folderPrefix: string, folderName: string) {
  //   const folderKey = `${folderPrefix}/${folderName}`;

  //   const fileList: string[] = [];
  //   let continuationToken: string | undefined = undefined;

  //   do {
  //     // Fetch files in the folder
  //     const data = await this.s3
  //       .listObjectsV2({
  //         Bucket: this.bucketName,
  //         Prefix: folderKey.endsWith('/') ? folderKey : `${folderKey}/`, // Ensure folderKey ends with a slash
  //         ContinuationToken: continuationToken, // For pagination
  //       })
  //       .promise();

  //     // Add files to the list
  //     if (data.Contents) {
  //       data.Contents.forEach((file) => {
  //         if (file.Key) {
  //           fileList.push(file.Key);
  //         }
  //       });
  //     }

  //     // Update continuation token
  //     continuationToken = data.NextContinuationToken;
  //   } while (continuationToken);

  //   return fileList;
  // }

  sanitizeFilename(filename: string): string {
    return filename
      .normalize('NFKD') // Normalize Unicode characters (e.g., remove diacritical marks)
      .replace('%E2%80%93', '-')
      .replace(/[\u2013\u2014]/g, '-') // Replace en-dash and em-dash with hyphen
      .replace(/\s+/g, '_') // Replace multiple spaces with a single space
      .replace(/%20/g, '_')
      .replace(/[^a-zA-Z0-9\s.-_]/g, '') // Remove any non-alphanumeric characters (except ., -)
      .trim(); // Remove leading/trailing spaces
  }
}