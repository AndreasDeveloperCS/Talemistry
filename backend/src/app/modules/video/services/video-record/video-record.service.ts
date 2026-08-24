import { Injectable } from '@nestjs/common';
import { ChunkPayload, VideoRecord, VideoRecordDocument } from '../../models/video-record';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { BaseService } from '../../../base/services/base.service';
import { Model } from 'mongoose';
import { S3Service } from '../../../base/services/s3.service';

@Injectable()
export class VideoRecordService extends BaseService<VideoRecord> {

    constructor(
        @InjectModel(VideoRecord.name)
        protected readonly model: Model<VideoRecordDocument>,

        @InjectRepository(VideoRecord)
        protected readonly repository: Repository<VideoRecord>,

        private readonly s3Service: S3Service,
    ) {
        super(model, repository);
    }

    async handleChunk(payload: ChunkPayload): Promise<{ success: boolean; message?: string; s3Url?: string }> {
        const { recordingId, chunkIndex, buffer, isLast, interviewId } = payload;

        try {
            const s3Key = `videos/${recordingId}.webm`;

            // First chunk: start multipart upload
            if (chunkIndex === 0) {
                await this.s3Service.startMultipartUpload(s3Key);
                console.log(`Started S3 multipart upload for ${recordingId}`);
            }

            // Upload chunk directly to S3 (buffered until 5MB is accumulated)
            await this.s3Service.uploadChunk(s3Key, buffer, isLast);
            console.log(`Processed chunk ${chunkIndex} for ${recordingId}`);

            // Last chunk: complete multipart upload and save DB record
            if (isLast) {
                const s3Url = await this.s3Service.completeMultipartUpload(s3Key);
                console.log(`Completed S3 multipart upload for ${recordingId}: ${s3Url}`);

                await this.model.create({
                    recordingId,
                    interviewId,
                    s3Url,
                    userId: payload.userId,
                    createdBy: payload.userId,
                });

                return { success: true, message: 'Video upload completed', s3Url };
            }

            return { success: true, message: `Chunk ${chunkIndex} uploaded` };
        } catch (error) {
            console.error(`Error handling chunk ${chunkIndex} for ${recordingId}:`, error);

            // Attempt to abort the multipart upload on error
            try {
                await this.s3Service.abortMultipartUpload(`videos/${recordingId}.webm`);
            } catch (abortError) {
                console.error('Failed to abort multipart upload:', abortError);
            }

            throw error;
        }
    }
}
