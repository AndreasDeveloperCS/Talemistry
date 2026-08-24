import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { PipelineStage, PipelineStageDocument } from '../models/pipeline-stage';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DeepPartial, Repository } from 'typeorm';
import { ObjectId } from 'mongodb';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class PipelineStagesService extends BaseService<PipelineStage> {

    constructor(
        @InjectModel(PipelineStage.name)
        protected readonly model: Model<PipelineStageDocument>,

        @InjectRepository(PipelineStage)
        protected readonly repository: Repository<PipelineStage>
    ) {
        super(model, repository);
    }

    createStages(stages: DeepPartial<PipelineStage>[]): PipelineStage[] {
        return this.repository.create(stages);
    }

    async saveStages(stages: PipelineStage[]): Promise<PipelineStage[]> {
        return this.repository.save(stages);
    }

    async getByPositionId(positionId: any): Promise<PipelineStage | any> {
        return this.repository.findOne({
            where: { positionId },
        });
    }

    async findByPipelineId(pipelineId: any): Promise<PipelineStage[]> {
        const pipelineIdObj = typeof pipelineId === 'string' ? new ObjectId(pipelineId) : pipelineId;
        return this.repository.find({ where: { positionPipelineId: pipelineIdObj } });
    }

    async updateStage(stageId: any, updateDto: Partial<PipelineStage>): Promise<PipelineStage> {
        const oid = new ObjectId(stageId);
        const existing = await this.repository.findOne({ where: { _id: oid } as any });
        if (!existing) {
            throw new Error('Stage not found');
        }

        Object.assign(existing, updateDto);
        return this.repository.save(existing);
    }

    async updateStagesOrder(orderedIds: ObjectId[]): Promise<void> {
        console.log('Updating stages order:', orderedIds);
        for (let i = 0; i < orderedIds.length; i++) {
            const id = orderedIds[i];

            const stage = await this.repository.findOne({ where: { _id: id } as any });
            if (!stage) continue;

            stage.order = i;
            await this.updateAsync(stage);
        }

        console.log('✅ All stage orders updated');
    }

    async deleteStagesByIds(ids: any[]): Promise<void> {
        const objectIds = ids.map((id) => (typeof id === 'string' ? new ObjectId(id) : id));
        await this.repository.delete({ _id: { $in: objectIds } } as any);
    }

    async deleteStageAsync(id: any): Promise<any> {
        const idObj = new ObjectId(id);
        try {
            const stageToDelete = await this.repository.findOne({ where: { _id: idObj } });

            if (!stageToDelete) {
                throw new NotFoundException(`Stage with ID "${idObj}" not found`);
            }

            const { positionPipelineId, order } = stageToDelete;

            const deletedStage = await this.deleteAsync(idObj);

            const remainingStages = await this.repository.find({
                where: { positionPipelineId },
                order: { order: 'ASC' },
            });

            for (let i = 0; i < remainingStages.length; i++) {
                const stage = remainingStages[i];
                if (stage.order !== i) {
                    await this.repository.update(stage._id, { order: i });
                }
            }

            return { success: true, deletedId: idObj };
        } catch (ex) {
            console.error(`Error in deleteAsync service method: ${ex.message}`);
            throw new InternalServerErrorException('Error occurred while deleting the stage');
        }
    }

    async getByIds(
        stageIds: ObjectId[]
    ): Promise<PipelineStage[]> {

        if (!stageIds.length) {
            return [];
        }

        console.log(
            'PipelineStageService.getByIds stageIds',
            stageIds.map(id => id.toString())
        );

        const stages = await this.repository.find({
            where: {
                _id: {
                    $in: stageIds
                }
            } as any
        });

        console.log(
            'PipelineStageService.getByIds stages',
            JSON.stringify(stages, null, 2)
        );

        return stages;
    }
}