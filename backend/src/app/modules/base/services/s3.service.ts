import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3';
import * as fs from 'fs';
import * as path from 'path';

interface MultipartUploadState {
    uploadId: string;
    parts: Array<{ PartNumber: number; ETag: string }>;
    buffer: Buffer;  // Accumulate chunks until we reach minimum size
    partNumber: number;
}

@Injectable()
export class S3Service {

    private readonly distributionDomainName = 'd6nrcrbzehdnr.cloudfront.net';
    private readonly s3Client: S3Client;
    private readonly bucketName = process.env.AWS_S3_BUCKET!;
    private readonly region = process.env.AWS_REGION!;

    // Store active multipart uploads in memory
    private readonly activeUploads = new Map<string, MultipartUploadState>();

    // S3 requires parts to be >= 5MB (except last part)
    private readonly MIN_PART_SIZE = 5 * 1024 * 1024; // 5MB

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

    async uploadFileFromPath(key: string, filePath: string): Promise<string> {
        const fileStream = fs.createReadStream(filePath);

        await this.s3Client.send(
            new PutObjectCommand({
                Bucket: this.bucketName,
                Key: key,
                Body: fileStream,
                ContentType: 'video/webm',
            }),
        );

        return `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }

    /**
     * Start a multipart upload for streaming video chunks
     */
    async startMultipartUpload(key: string): Promise<string> {
        const command = new CreateMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            ContentType: 'video/webm',
        });

        const response = await this.s3Client.send(command);
        const uploadId = response.UploadId!;

        this.activeUploads.set(key, {
            uploadId,
            parts: [],
            buffer: Buffer.alloc(0),
            partNumber: 1,
        });

        console.log(`Started multipart upload: ${key} (uploadId: ${uploadId})`);
        return uploadId;
    }

    /**
     * Accumulate chunk and upload when buffer reaches minimum size (5MB)
     */
    async uploadChunk(
        key: string,
        buffer: Buffer,
        isLast: boolean,
    ): Promise<void> {
        const uploadState = this.activeUploads.get(key);
        if (!uploadState) {
            throw new Error(`No active multipart upload found for key: ${key}`);
        }

        // Append new chunk to buffer
        uploadState.buffer = Buffer.concat([uploadState.buffer, buffer]);

        // Upload if buffer >= 5MB OR this is the last chunk
        if (uploadState.buffer.length >= this.MIN_PART_SIZE || isLast) {
            const command = new UploadPartCommand({
                Bucket: this.bucketName,
                Key: key,
                PartNumber: uploadState.partNumber,
                UploadId: uploadState.uploadId,
                Body: uploadState.buffer,
            });

            const response = await this.s3Client.send(command);

            uploadState.parts.push({
                PartNumber: uploadState.partNumber,
                ETag: response.ETag!,
            });

            console.log(`Uploaded part ${uploadState.partNumber} for ${key} (size: ${uploadState.buffer.length} bytes, ETag: ${response.ETag})`);

            // Reset buffer and increment part number
            uploadState.buffer = Buffer.alloc(0);
            uploadState.partNumber++;
        } else {
            console.log(`Buffering chunk for ${key} (current buffer size: ${uploadState.buffer.length} bytes)`);
        }
    }

    /**
     * Complete the multipart upload and finalize the S3 object
     */
    async completeMultipartUpload(key: string): Promise<string> {
        const uploadState = this.activeUploads.get(key);
        if (!uploadState) {
            throw new Error(`No active multipart upload found for key: ${key}`);
        }

        // Sort parts by part number (required by S3)
        uploadState.parts.sort((a, b) => a.PartNumber - b.PartNumber);

        const command = new CompleteMultipartUploadCommand({
            Bucket: this.bucketName,
            Key: key,
            UploadId: uploadState.uploadId,
            MultipartUpload: {
                Parts: uploadState.parts,
            },
        });

        const response = await this.s3Client.send(command);
        this.activeUploads.delete(key);

        console.log(`Completed multipart upload: ${key}`);
        return response.Location || `https://${this.bucketName}.s3.${this.region}.amazonaws.com/${key}`;
    }

    /**
     * Abort a multipart upload (cleanup on error)
     */
    async abortMultipartUpload(key: string): Promise<void> {
        const uploadState = this.activeUploads.get(key);
        if (!uploadState) {
            return;
        }

        try {
            const command = new AbortMultipartUploadCommand({
                Bucket: this.bucketName,
                Key: key,
                UploadId: uploadState.uploadId,
            });

            await this.s3Client.send(command);
            console.log(`Aborted multipart upload: ${key}`);
        } catch (error) {
            console.error(`Failed to abort multipart upload for ${key}:`, error);
        } finally {
            this.activeUploads.delete(key);
        }
    }
}
