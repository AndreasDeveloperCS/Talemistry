import { Injectable } from '@nestjs/common';
import { PositionPipeline, PositionPipelineDocument } from '../models/position-pipeline';
import { BaseService } from '../../base/services/base.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PipelineStagesService } from './pipeline-stages.service';
import { ObjectId } from 'bson';
import { PipelineStage } from '../models/pipeline-stage';
import { DEFAULT_PIPELINE_STAGES } from '../models/default-pipeline-stage';

@Injectable()
export class PositionPipelinesService extends BaseService<PositionPipeline> {

    constructor(
        @InjectModel(PositionPipeline.name)
        protected readonly model: Model<PositionPipelineDocument>,

        @InjectRepository(PositionPipeline)
        protected readonly repository: Repository<PositionPipeline>,

        private readonly pipelineStageService: PipelineStagesService,
    ) {
        super(model, repository);
    }

    async createPipelineWithStages(
        positionId: any,
        userId: any,
        providedStages?: Partial<PipelineStage>[],
        ): Promise<any> {
        console.log('➡️ Starting pipeline creation process');
        console.log('📌 Input:', { positionId, userId, providedStages });

        let savedPipeline: PositionPipeline;
        let savedStages: PipelineStage[];

        try {
            const pipeline = {
                positionId: new ObjectId(positionId),
                userId: new ObjectId(userId),
                createdBy: new ObjectId(userId),
                createdDate: new Date(),
                stages: [],
            } as PositionPipeline;
            console.log('✅ Pipeline entity created (not saved yet):', pipeline);

            try {
                savedPipeline = await this.createAsync(pipeline); 
                console.log('💾 Pipeline saved:', savedPipeline);
            } catch (err) {
                console.error('❌ Error saving pipeline:', err);
            }

            const stagesToUse = providedStages ?? DEFAULT_PIPELINE_STAGES;
            console.log('📑 Stages prepared for creation:', stagesToUse);

            const stageEntities: PipelineStage[] = stagesToUse.map((s) => ({
                ...s,
                positionId: new ObjectId(positionId),
                positionPipelineId: savedPipeline._id,
            })) as PipelineStage[];
            console.log('✅ Stage entities created (not saved yet):', stageEntities);

            try {
            savedStages = [];
            for (const stage of stageEntities) {
                console.log('💾 Saving stage:', stage);
                const saved = await this.pipelineStageService.createAsync(stage);
                console.log('✅ Saved stage:', saved);
                savedStages.push(saved);
            }
                console.log('💾 All stages saved successfully');
            } catch (err) {
                console.error('❌ Error saving stages:', err);
                try {
                    await this.repository.delete(savedPipeline._id as any);
                    console.warn('⚠️ Pipeline rollback executed for:', savedPipeline._id);
                } catch (delErr) {
                    console.error('❌ Pipeline rollback failed:', delErr);
                }
            }

            try {
                savedPipeline.stages = savedStages.map((s) => s._id);
                await this.updateAsync(savedPipeline); 
                console.log('🔗 Pipeline updated with stage references:', savedPipeline);
            } catch (err) {
                console.error('❌ Error linking stages to pipeline:', err);
            }

            const result = {
            ...savedPipeline,
            stages: savedStages,
            };
            console.log('🏁 Final pipeline with stages:', result);

            return result;
        } catch (err) {
            console.error('💥 Pipeline creation failed:', err);
            throw err;
        }
    }

    async getPipelineWithStagesByPositionId(positionId: any): Promise<any> {
        const pipeline = await this.repository.findOne({ where: { positionId: new ObjectId(positionId) } });
        if (!pipeline){
            return null;
        }

        const stages = await this.pipelineStageService.findByPipelineId(pipeline._id);
        return { ...pipeline, stages };
    }

    async getAllByPositionId(positionId: any): Promise<PositionPipeline[]> {
        return this.repository.find({ where: { positionId: new ObjectId(positionId) } });
    }

    async updatePipelineStagesOrder(
        pipelineId: string,
        orderedStageIds: string[],
    ): Promise<void> {
        const pipelineObjectId = new ObjectId(pipelineId);
        const orderedObjectIds = orderedStageIds.map((id) => new ObjectId(id));

        console.log('🔄 Updating pipeline stages order...');
        console.log('Pipeline ID:', pipelineId);
        console.log('New order of stage IDs:', orderedStageIds);

        try {
            console.log('Fetching pipeline from DB...');
            const pipeline = await this.repository.findOne({
                where: { _id: pipelineObjectId as any },
            });
            console.log('Pipeline fetched:', pipeline);

            if (!pipeline) {
                console.error('❌ Pipeline not found:', pipelineId);
                throw new Error('Pipeline not found');
            }

            pipeline.stages = orderedObjectIds;
            console.log('Pipeline before save:', pipeline);
            const result = await this.updateAsync(pipeline);
            console.log('Pipeline after save:', result);
            console.log('✅ Pipeline stages array updated in pipeline document');

            await this.pipelineStageService.updateStagesOrder(orderedObjectIds);
            console.log('✅ Stage documents updated with new order');
        } catch (err) {
            console.error('❌ Failed to update pipeline stages order:', err);
            throw err;
        }
    }

    async deletePipelineByPositionId(positionId: any): Promise<void> {
        const objectId = new ObjectId(positionId);

        const pipelines = await this.repository.find({ where: { positionId: objectId } });
        if (!pipelines?.length) return;

        const allStageIds = pipelines.flatMap((p) =>
            (p.stages ?? []).map((stage: any) =>
                stage && typeof stage === 'object' && stage._id ? stage._id : stage
            )
        ) as ObjectId[];

        if (allStageIds.length) {
        await this.pipelineStageService.deleteStagesByIds(allStageIds);
        }

        await this.repository.delete({ positionId: objectId } as any);
    }

    async getByPositionId(positionId: any): Promise<PositionPipeline | any> {
        return this.repository.findOne({
            where: { positionId },
        });
    }

    async getStagesMapForPositions(
        positionIds: string[]
    ): Promise<Record<string, PipelineStage[]>> {

        const objectIds = positionIds.map(
            id => new ObjectId(id)
        );

        // 1. Get pipelines
        const pipelines = await this.repository.find({
            where: {
                positionId: {
                    $in: objectIds
                }
            } as any
        });

        // 2. Collect ALL stage ids
        const allStageIds: ObjectId[] = [];

        for (const pipeline of pipelines) {

            const stageIds =
                (pipeline.stages || []) as ObjectId[];

            allStageIds.push(...stageIds);
        }

        // 3. Load REAL stages
        const stages = await this.pipelineStageService.getByIds(allStageIds);

        // 4. Create quick lookup map
        const stagesById = new Map<string, PipelineStage>();

        for (const stage of stages) {

            stagesById.set(
                stage._id.toString(),
                stage
            );
        }

        // 5. Build result grouped by position
        const result: Record<string, PipelineStage[]> = {};

        for (const pipeline of pipelines) {

            const pid = pipeline.positionId.toString();

            const stageIds =
                (pipeline.stages || []) as ObjectId[];

            result[pid] = stageIds
                .map(stageId =>
                    stagesById.get(stageId.toString())
                )
                .filter(Boolean)
                .sort((a, b) => a.order - b.order);

        }

        return result;
    }
}