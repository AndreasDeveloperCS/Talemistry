import { Injectable } from '@nestjs/common';
import { BaseService } from '../../base/services/base.service';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { TalentNote, TalentNoteDocument } from '../models/talent-note';
import { ObjectId } from 'bson';

@Injectable()
export class TalentNotesService extends BaseService<TalentNote> {

    constructor(
        @InjectModel(TalentNote.name)
        protected readonly model: Model<TalentNoteDocument>,
    
        @InjectRepository(TalentNote)
        protected readonly repository: Repository<TalentNote>
    ) {
        super(model, repository);
    }

    async getByPositionIdTalentIdAsync(positionId: any, talentId: any): Promise<TalentNote> {
        const talentIdObj = typeof talentId === 'string' ? new ObjectId(talentId) : talentId;
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const talentNote = await this.repository.findOne({
            where: { positionId: positionIdObj, talentId: talentIdObj },
        });
        console.log('getByPositionIdTalentIdAsync', talentNote);

        return talentNote;
    }

    async getByPositionIdTalentIdsMap(
        positionId: any,
        talentIds: ObjectId[],
    ): Promise<Map<string, TalentNote>> {
        if (!talentIds.length) {
            return new Map();
        }

        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const notes = await this.repository.find({
            where: {
                positionId: positionIdObj,
                talentId: { $in: talentIds }, 
            } as any, 
        });

        const map = new Map<string, TalentNote>();
        for (const note of notes) {
            map.set(note.talentId.toString(), note);
        }

        return map;
    }

    async getByPositionTalentPairsMap(
        pairs: {
            positionId: ObjectId;
            talentId: ObjectId;
        }[]
    ): Promise<Map<string, TalentNote>> {

        if (!pairs.length) {
            return new Map();
        }

        const orConditions = pairs.map(pair => ({
            positionId:
                typeof pair.positionId === 'string'
                    ? new ObjectId(pair.positionId)
                    : pair.positionId,

            talentId:
                typeof pair.talentId === 'string'
                    ? new ObjectId(pair.talentId)
                    : pair.talentId
        }));

        const notes = await this.repository.find({
            where: {
                $or: orConditions
            } as any
        });

        const map = new Map<string, TalentNote>();

        for (const note of notes) {

            const key =
                `${note.positionId}_${note.talentId}`;

            map.set(key, note);
        }

        return map;
    }

    async getByPositionIdsTalentIdMap(
        positionIds: ObjectId[],
        talentId: ObjectId,
    ): Promise<Map<string, TalentNote>> {

        if (!positionIds.length) {
            return new Map();
        }

        const notes = await this.repository.find({
            where: {
                positionId: { $in: positionIds },
                talentId,
            } as any,
        });

        const map = new Map<string, TalentNote>();

        for (const note of notes) {
            map.set(
                `${note.positionId.toString()}_${note.talentId.toString()}`,
                note,
            );
        }

        return map;
    }
}
