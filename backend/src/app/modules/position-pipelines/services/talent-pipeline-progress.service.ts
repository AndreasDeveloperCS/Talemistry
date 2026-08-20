import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { Filtering } from '../../../helpers/filtering';
import { PaginatedResource, Pagination } from '../../../helpers/pagination';
import { Sorting } from '../../../helpers/sorting';
import { BaseService } from '../../base/services/base.service';
import { IContact } from '../../communication/models/chat-message-payload';
import { PositionDetails, PositionStatus } from '../../positions/models/position-item';
import { PositionsService } from '../../positions/services/positions.service';
import { ProfilePhotoService } from '../../profiles/services/profile-photo.service';
import { TalentProfileService } from '../../profiles/services/talent-profile.service';
import { UsersService } from '../../users/services/user.service';
import { StageType } from '../models/pipeline-stage';
import { EnrichedAppliedPositionsProgress, EnrichedTalentPipelineProgress, IApplicantsByStage, IApplicantsByStageGlobal, ITalentPipelineProgressGroup, ITalentPipelineStagesGroup, TalentPipelineProgress, TalentPipelineProgressDocument } from '../models/talent-pipeline-progress';
import { PositionPipelinesService } from './position-pipelines.service';
import { TalentNotesService } from './talent-notes.service';
import { StageStatus } from '../types/pipeline.types';

export interface IAppliedPosition {
    positionId: ObjectId | string;
    positionTitle: string;
    appliedDate: Date;
    positionDetails: PositionDetails;
    currentStage: string;
    currentStageStatus: string;
}

export interface RecruitmentFunnel {
    positionId: ObjectId | string;
    positionTitle: string;
    positionStatus: PositionStatus;
    applicantsCount: number;
    pipelineStagesInfo: RecruitmentPipelineStageInfo[];
}

export interface RecruitmentPipelineStageInfo {
    stageId: ObjectId | string;
    stageName: string;
    stageType: StageType;
    candidatesCount: number;
    order: number;
}

@Injectable()
export class TalentPipelineProgressService extends BaseService<TalentPipelineProgress> {

    keyPairId = process.env.AWS_CLOUDFRONT_KEY_PAIR_ID!;
    privateKey = process.env.AWS_CLOUDFRONT_PRIVATE_KEY!;

    constructor(
        @InjectModel(TalentPipelineProgress.name)
        protected readonly model: Model<TalentPipelineProgressDocument>,

        @InjectRepository(TalentPipelineProgress)
        protected readonly repository: Repository<TalentPipelineProgress>,
        
        @Inject(forwardRef(() => PositionsService))
        protected readonly positionsService: PositionsService,

        protected readonly userService: UsersService,
        protected readonly profilePhotoService: ProfilePhotoService,
        protected readonly profileService: TalentProfileService,
        protected readonly positionPipelineService: PositionPipelinesService,
        protected readonly talentsnotesService: TalentNotesService,
    ) {
        super(model, repository);
    }

    async getTalentPipelineByUserId(userId: any, requestingUser?: ObjectId): Promise<TalentPipelineProgress[]> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        const records = await this.repository.find({ where: { userId: userIdObj } });
        return records;
    }
    
    async getTalentPipelineByPositionId(positionId: any, requestingUser?: ObjectId): Promise<ITalentPipelineProgressGroup[]> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const records = await this.repository.find({ where: { positionId: positionIdObj } });
        const values = Array.from(new Map(records.map(r => [r.talentId.toString(), r.talentId])).values());
        const photoURL = await this.profilePhotoService.getMainPhotoURLMap(values);
        const talentNotesMap = await this.talentsnotesService.getByPositionIdTalentIdsMap(positionIdObj, values);
        const skillsMap = await this.profileService.getSkillsByTalentIdsMap(values, requestingUser);

        const position = await this.positionsService.getByIdAsync(positionIdObj);
        const positionName = position.title;
        const companyName = position.positionDetails.company.data.companyName;
        const companyId = position.positionDetails.company._id.toString();

        const enrichedRecords: EnrichedTalentPipelineProgress[] = records.map(r => ({
            ...r,
            positionName,
            companyName,
            companyId
        }));

        const grouped = Object.values(
            enrichedRecords.reduce((acc, record) => {
                const tid = record.talentId.toString();
                if (!acc[tid]) {
                    acc[tid] = {
                        talentId: tid,
                        photoUrl: photoURL.get(tid),
                        talentNote: talentNotesMap.get(tid) ?? null,
                        skills: skillsMap.get(tid) ?? [],
                        records: []
                    };
                }
                acc[tid].records.push(record);
                return acc;
            }, {} as Record<string, ITalentPipelineProgressGroup>)
        );

        return grouped;
    }

    async getApplicantsByPositionIdStage(positionId: any, stageType: StageType, requestingUser?: ObjectId): Promise<IApplicantsByStage> {
        console.log('Fetching applicants by stage with params:', { positionId, stageType });
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const records = await this.repository.find({
            where: {
                positionId: positionIdObj,
                stageType
            }
        });
        console.log('Records fetched for applicants by stage:', records);

        if (!records.length) {
            const position = await this.positionsService.getByIdAsync(positionIdObj);

            return {
                positionId: positionIdObj.toString(),
                positionTitle: position.title,
                stageType,
                stageName: '',
                applicants: []
            };
        }

        // Exclude rejected
        const filtered = records.filter(
            r => r.finalDecision !== StageStatus.failed
        );

        // Group by talent
        const groupedMap = new Map<string, any>();

        for (const record of filtered) {

            const talentId = record.talentId.toString();

            const existing = groupedMap.get(talentId);

            // Keep latest record
            if (
                !existing ||
                new Date(record.modifiedDate).getTime() >
                new Date(existing.modifiedDate).getTime()
            ) {
                groupedMap.set(talentId, record);
            }
        }

        const latestRecords = Array.from(groupedMap.values());

        const talentIds = latestRecords.map(
            r => r.talentId
        );

        const photoURL =
            await this.profilePhotoService
                .getMainPhotoURLMap(talentIds);

        const skillsMap =
            await this.profileService
                .getSkillsByTalentIdsMap(
                    talentIds,
                    requestingUser
                );

        const talentNotesMap =
            await this.talentsnotesService
                .getByPositionIdTalentIdsMap(
                    positionIdObj,
                    talentIds
                );

        const position =
            await this.positionsService
                .getByIdAsync(positionIdObj);

        return {
            positionId: positionIdObj.toString(),
            positionTitle: position.title,
            stageType,
            stageName: latestRecords[0]?.stageName,

            applicants: latestRecords.map(record => ({
                talentId: record.talentId,
                talentName: record.talentName,

                photoUrl: photoURL.get(
                    record.talentId.toString()
                ),

                finalDecision: record.finalDecision,

                assessmentScore:
                    record.assessmentScore,

                latestProgressId: record._id,

                latestModifiedDate:
                    record.modifiedDate,

                skills:
                    skillsMap.get(
                        record.talentId.toString()
                    ) ?? [],

                talentNote:
                    talentNotesMap.get(
                        record.talentId.toString()
                    ) ?? null
            }))
        };
    }

    async getApplicantsByStage(
        stageType: StageType,
        requestingUser?: ObjectId
    ): Promise<IApplicantsByStageGlobal> {

        console.log('Fetching applicants by stage:', {
            stageType
        });

        const records = await this.repository.find({
            where: {
                stageType
            }
        });

        console.log(
            'Records fetched for applicants by stage:',
            records
        );

        if (!records.length) {
            return {
                stageType,
                stageName: '',
                applicants: []
            };
        }

        // Exclude rejected
        const filtered = records.filter(
            r => r.finalDecision !== StageStatus.failed
        );

        // Keep latest record per talent + position
        const groupedMap = new Map<string, any>();

        for (const record of filtered) {

            const key =
                `${record.positionId}_${record.talentId}`;

            const existing = groupedMap.get(key);

            if (
                !existing ||
                new Date(record.modifiedDate).getTime() >
                new Date(existing.modifiedDate).getTime()
            ) {
                groupedMap.set(key, record);
            }
        }

        const latestRecords = Array.from(
            groupedMap.values()
        );

        const talentIds = latestRecords.map(
            r => r.talentId
        );

        const positionIds = [
            ...new Set(
                latestRecords.map(
                    r => r.positionId.toString()
                )
            )
        ];

        const photoURL =
            await this.profilePhotoService
                .getMainPhotoURLMap(talentIds);

        const skillsMap =
            await this.profileService
                .getSkillsByTalentIdsMap(
                    talentIds,
                    requestingUser
                );

        // Get positions map
        const positions = await this.positionsService.getByIds(positionIds);

        const positionsMap = new Map(
            positions.map(position => [
                position._id.toString(),
                position
            ])
        );

        // Notes map by position + talent
        const talentNotesMap =
            await this.talentsnotesService
                .getByPositionTalentPairsMap(
                    latestRecords.map(record => ({
                        positionId: record.positionId,
                        talentId: record.talentId
                    }))
                );

        return {
            stageType,
            stageName: latestRecords[0]?.stageName,

            applicants: latestRecords.map(record => {

                const position =
                    positionsMap.get(
                        record.positionId.toString()
                    );

                const noteKey =
                    `${record.positionId}_${record.talentId}`;

                return {
                    positionId:
                        record.positionId.toString(),

                    positionTitle:
                        position?.title ?? '',

                    talentId:
                        record.talentId,

                    talentName:
                        record.talentName,

                    photoUrl:
                        photoURL.get(
                            record.talentId.toString()
                        ),

                    finalDecision:
                        record.finalDecision,

                    assessmentScore:
                        record.assessmentScore,

                    latestProgressId:
                        record._id,

                    latestModifiedDate:
                        record.modifiedDate,

                    skills:
                        skillsMap.get(
                            record.talentId.toString()
                        ) ?? [],

                    talentNote:
                        talentNotesMap.get(
                            noteKey
                        ) ?? null
                };
            })
        };
    }

    async getTalentPipelineByTalentId(talentId: any, requestingUser?: ObjectId): Promise<ITalentPipelineProgressGroup[]> {
        const talentIdObj = typeof talentId === 'string' ? new ObjectId(talentId) : talentId;

        const records = await this.repository.find({
            where: { talentId: talentIdObj }
        });

        if (!records?.length) {
            return [];
        }

        const photoURL = await this.profilePhotoService.getMainPhotoURLMap([talentIdObj]);
        const skillsMap = await this.profileService.getSkillsByTalentIdsMap(
            [talentIdObj],
            requestingUser
        );

        const positionIds = [
            ...new Set(records.map(r => r.positionId.toString()))
        ].map(id => new ObjectId(id));

        const talentNotesMap =
            await this.talentsnotesService.getByPositionIdsTalentIdMap(
                positionIds,
                talentIdObj
            );

        const positions = await Promise.all(
            positionIds.map(id => this.positionsService.getByIdAsync(id))
        );

        const positionMap = new Map(
            positions.map(position => [
                position._id.toString(),
                {
                    positionName: position.title,
                    companyName: position.positionDetails.company.data.companyName,
                    companyId: position.positionDetails.company._id.toString()
                }
            ])
        );

        const enrichedRecords: EnrichedTalentPipelineProgress[] = records.map(r => {
            const positionData = positionMap.get(r.positionId.toString());

            return {
                ...r,
                positionName: positionData?.positionName,
                companyName: positionData?.companyName,
                companyId: positionData?.companyId
            };
        });

        const grouped = Object.values(
            enrichedRecords.reduce((acc, record) => {
                const pid = record.positionId.toString();

                if (!acc[pid]) {
                    acc[pid] = {
                        talentId: talentIdObj.toString(),
                        photoUrl: photoURL.get(talentIdObj.toString()),
                        talentNote:
                            talentNotesMap.get(
                                `${pid}_${talentIdObj.toString()}`
                            ) ?? null,
                        skills: skillsMap.get(talentIdObj.toString()) ?? [],
                        records: []
                    };
                }

                acc[pid].records.push(record);

                return acc;
            }, {} as Record<string, ITalentPipelineProgressGroup>)
        );

        return grouped;
    }

    async getTalentPipelineByTalentIdPositionId(
        talentId: any,
        positionId: any,
        requestingUser?: ObjectId
    ): Promise<ITalentPipelineProgressGroup | null> {

        const talentIdObj =
            typeof talentId === 'string'
                ? new ObjectId(talentId)
                : talentId;

        const positionIdObj =
            typeof positionId === 'string'
                ? new ObjectId(positionId)
                : positionId;

        const records = await this.repository.find({
            where: {
                talentId: talentIdObj,
                positionId: positionIdObj
            }
        });

        if (!records?.length) {
            return null;
        }

        const photoURL = await this.profilePhotoService.getMainPhotoURLMap([
            talentIdObj
        ]);

        const talentNotesMap =
            await this.talentsnotesService.getByPositionIdTalentIdsMap(
                positionIdObj,
                [talentIdObj]
            );

        const skillsMap = await this.profileService.getSkillsByTalentIdsMap(
            [talentIdObj],
            requestingUser
        );

        const position = await this.positionsService.getByIdAsync(positionIdObj);

        const positionName = position.title;
        const companyName = position.positionDetails.company.data.companyName;
        const companyId =
            position.positionDetails.company._id.toString();

        const enrichedRecords: EnrichedTalentPipelineProgress[] = records.map(r => ({
            ...r,
            positionName,
            companyName,
            companyId
        }));

        return {
            talentId: talentIdObj.toString(),
            photoUrl: photoURL.get(talentIdObj.toString()),
            talentNote:
                talentNotesMap.get(talentIdObj.toString()) ?? null,
            skills: skillsMap.get(talentIdObj.toString()) ?? [],
            records: enrichedRecords
        };
    }

    async getGroupedTalentPipelineStagesByPositionId(
        positionId: any,
        requestingUser?: ObjectId
    ): Promise<ITalentPipelineStagesGroup[]> {

        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;
        const records = await this.repository.find({ where: { positionId: positionIdObj } });
        const values = Array.from(new Map(records.map(r => [r.talentId.toString(), r.talentId])).values());
        const photoURL = await this.profilePhotoService.getMainPhotoURLMap(values);
        const talentNotesMap = await this.talentsnotesService.getByPositionIdTalentIdsMap(positionIdObj, values);
        const skillsMap = await this.profileService.getSkillsByTalentIdsMap(values, requestingUser);

        const grouped = Object.values(
            records.reduce((acc, record) => {
            const tid = record.talentId.toString();

            if (!acc[tid]) {
                acc[tid] = {
                    talentId: tid,
                    photoUrl: photoURL.get(tid),
                    talentNote: talentNotesMap.get(tid) ?? null,
                    skills: skillsMap.get(tid) ?? [],
                    stages: [],
                };
            }

            const stageId = record.stageId.toString();
            if (!acc[tid].stages.includes(stageId)) {
                acc[tid].stages.push(stageId);
            }

            return acc;
            }, {} as Record<string, ITalentPipelineStagesGroup>)
        );

        return grouped;
    }

    async getTalentPipelineStagesByPositionId(
        positionId: any,
        talentId: ObjectId
    ): Promise<TalentPipelineProgress[]> {

        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;
        const filter: any = { positionId: positionIdObj };
        filter.talentId = typeof talentId === 'string' ? new ObjectId(talentId) : talentId;

        const records = await this.repository.find({
            where: filter,
            order: { createdDate: -1 } 
        });

        if (!records || records.length === 0) {
            return [];
        }

        const uniqueStagesMap = new Map<string, TalentPipelineProgress>();

        for (const r of records) {
            const stageId = r.stageId.toString();

            if (!uniqueStagesMap.has(stageId)) {
                uniqueStagesMap.set(stageId, {
                    ...r
                });
            }
        }

        return Array.from(uniqueStagesMap.values());
    }

    async getTalentsByUserId(userId: any): Promise<any[]> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        const records = await this.repository.find({ where: { userId: userIdObj } });
        const talentIds = records.map(r => r.talentId.toString());
        return Array.from(new Set(talentIds));
    }

    async getTalentsForPositionsByUserId(userId: any): Promise<Record<string, string[]>> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

        const records = await this.repository.find({
            where: { userId: userIdObj }
        });

        const grouped = records.reduce((acc, record) => {
            const pid = record.positionId.toString();
            const tid = record.talentId.toString();

            if (!acc[pid]) {
                acc[pid] = [];
            }
            if (!acc[pid].includes(tid)) {
                acc[pid].push(tid);
            }

            return acc;
        }, {} as Record<string, string[]>);

        return grouped;
    }

    async getApplicantsCountForPositionsByUserId(userId: ObjectId): Promise<Record<string, number>> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

        const records = await this.repository.find({ where: { userId: userIdObj } });

        const counts = records.reduce((acc, record) => {
            const pid = record.positionId.toString();
            const tid = record.talentId.toString();

            if (!acc[pid]) {
                acc[pid] = new Set<string>();
            }

            acc[pid].add(tid);

            return acc;
        }, {} as Record<string, Set<string>>);

        const result: Record<string, number> = Object.fromEntries(
            Object.entries(counts).map(([pid, set]) => [pid, set.size])
        );

        return result;
    }

    async getFunnelsForPositions(
        positionIds: string[]
    ): Promise<Record<string, RecruitmentFunnel>> {

        const objectIds = positionIds.map(
            id => new ObjectId(id)
        );

        const stagesMap = await this.positionPipelineService.getStagesMapForPositions(positionIds);

        // 2. Initialize funnels ONLY from pipelines
        const funnels: Record<string, RecruitmentFunnel> = {};

        for (const positionId of positionIds) {

            const fullStages = stagesMap[positionId] || [];

            funnels[positionId] = {

                positionId,

                positionTitle: '',
                positionStatus: undefined,

                applicantsCount: 0,

                pipelineStagesInfo: fullStages.map(
                    stage => ({

                        stageId: stage._id,

                        stageName: stage.name,

                        stageType: stage.type ?? this.mapStageNameToType(stage.name),

                        order: stage.order,

                        candidatesCount: 0
                    })
                )
            };

            (funnels[positionId] as any)._candidateIds =
                new Set<string>();
        }

        // 3. Get progress records
        const records = await this.repository.find({
            where: {
                positionId: {
                    $in: objectIds
                }
            } as any
        });

        // 4. Apply counts to existing stages
        for (const record of records) {

            const pid = record.positionId.toString();

            const funnel = funnels[pid];

            if (!funnel) {
                continue;
            }

            (funnel as any)._candidateIds.add(
                record.talentId.toString()
            );

            const existingStage =
                funnel.pipelineStagesInfo.find(
                    s =>
                        s.stageType === record.stageType
                );

            if (existingStage) {

                existingStage.candidatesCount++;
            }
            else {
            }
        }

        // 5. Finalize
        for (const pid of Object.keys(funnels)) {

            const funnel = funnels[pid];

            funnel.applicantsCount =
                (funnel as any)._candidateIds.size;

            delete (funnel as any)._candidateIds;

            funnel.pipelineStagesInfo.sort(
                (a, b) => a.order - b.order
            );
        }

        return funnels;
    }
    
    async getAppliedPositionsByTalentIdPaginated(
        talentId: string,
        pagination: Pagination,
        sort?: Sorting,
        filters?: Filtering
    ): Promise<PaginatedResource<EnrichedAppliedPositionsProgress> & {
        funnel?: Record<string, number>;
    }> {

        const talentIdObj =
            typeof talentId === 'string'
                ? new ObjectId(talentId)
                : talentId;

        const { limit, offset, page, size } = pagination;

        const baseMatch = {
            talentId: talentIdObj
        };

        /**
         * =========================
         * 1. CURRENT POSITION STATE
         * =========================
         */
        const records = await this.model.aggregate([
            { $match: baseMatch },

            {
                $addFields: {
                    stagePriority: {
                        $switch: {
                            branches: [
                                { case: { $eq: ["$stageType", StageType.FINAL] }, then: 7 },
                                { case: { $eq: ["$stageType", StageType.OFFER] }, then: 6 },
                                { case: { $eq: ["$stageType", StageType.INTERVIEW] }, then: 5 },
                                { case: { $eq: ["$stageType", StageType.ASSESSMENT] }, then: 4 },
                                { case: { $eq: ["$stageType", StageType.SCREENING] }, then: 3 },
                                { case: { $eq: ["$stageType", StageType.CV_REVIEW] }, then: 2 },
                                { case: { $eq: ["$stageType", StageType.DEFAULT] }, then: 1 }
                            ],
                            default: 0
                        }
                    }
                }
            },

            {
                $sort: {
                    positionId: 1,
                    stagePriority: -1,
                    createdDate: -1
                }
            },

            {
                $group: {
                    _id: "$positionId",
                    record: { $first: "$$ROOT" }
                }
            }
        ]);

        /**
         * =========================
         * 2. FUNNEL STATS (FIXED)
         * =========================
         * counts ALL reached stages per position
         */
        const funnelRaw = await this.model.aggregate([
            { $match: baseMatch },

            {
                $group: {
                    _id: {
                        positionId: "$positionId",
                        stageType: "$stageType"
                    }
                }
            },

            {
                $group: {
                    _id: "$_id.stageType",
                    count: { $sum: 1 }
                }
            }
        ]);

        const funnel: Record<string, number> = {
            [StageType.DEFAULT]: 0,
            [StageType.CV_REVIEW]: 0,
            [StageType.SCREENING]: 0,
            [StageType.ASSESSMENT]: 0,
            [StageType.INTERVIEW]: 0,
            [StageType.OFFER]: 0,
            [StageType.FINAL]: 0
        };

        for (const row of funnelRaw) {
            funnel[row._id] = row.count;
        }

        /**
         * =========================
         * 3. EMPTY CHECK
         * =========================
         */
        if (!records || records.length === 0) {
            return {
                items: [],
                totalItems: 0,
                page,
                size,
                funnel
            };
        }

        /**
         * =========================
         * 4. FLATTEN RESULTS
         * =========================
         */
        let uniqueRecords = records.map(r => r.record);

        /**
         * =========================
         * 5. FILTERING (UI LEVEL)
         * =========================
         */
        if (filters && filters.length > 0) {
            uniqueRecords = uniqueRecords.filter(r => {
                return filters.every(f => {
                    const val = (r as any)[f.property];
                    return f.value === val;
                });
            });
        }

        /**
         * =========================
         * 6. SORTING (UI LEVEL)
         * =========================
         */
        if (sort && Object.keys(sort).length > 0) {
            const [[field, order]] = Object.entries(sort);

            uniqueRecords.sort((a, b) => {
                const aVal = (a as any)[field];
                const bVal = (b as any)[field];

                if (aVal < bVal) return order === 1 ? -1 : 1;
                if (aVal > bVal) return order === 1 ? 1 : -1;
                return 0;
            });
        }

        const total = uniqueRecords.length;

        /**
         * =========================
         * 7. PAGINATION
         * =========================
         */
        const paginatedRecords = uniqueRecords.slice(offset, offset + limit);

        /**
         * =========================
         * 8. ENRICHMENT
         * =========================
         */
        const positions = await Promise.all(
            paginatedRecords.map(r =>
                this.positionsService.getByIdAsync(r.positionId)
            )
        );

        const enrichedRecords: EnrichedAppliedPositionsProgress[] =
            paginatedRecords
                .map((r, index) => {
                    const position = positions[index];
                    if (!position) return null;

                    return {
                        _id: r._id?.toString(),
                        positionId: r.positionId?.toString(),
                        positionOwner: position.createdBy.toString(),
                        appliedDate: r.createdDate,
                        positionName: position.title,
                        positionStatus: position.status,
                        companyName:
                            position?.positionDetails?.company?.data?.companyName || "",
                        companyId:
                            position?.positionDetails?.company?._id?.toString() || "",
                        currentStage: r.stageName,
                        currentStageType: r.stageType,
                        currentStageStatus: r.status
                    };
                })
                .filter(Boolean) as EnrichedAppliedPositionsProgress[];

        /**
         * =========================
         * 9. RESPONSE
         * =========================
         */
        return {
            items: enrichedRecords,
            totalItems: total,
            page,
            size,
            funnel
        };
    }

    async getPositionsReachedStageByTalentIdPaginated(
        talentId: string | ObjectId,
        stageType: StageType,
        pagination: Pagination,
        sort?: Sorting,
        filters?: Filtering
    ): Promise<PaginatedResource<EnrichedAppliedPositionsProgress>> {

        const talentIdObj =
            typeof talentId === 'string'
                ? new ObjectId(talentId)
                : talentId;

        const { limit, offset, page, size } = pagination;

        /**
         * =========================
         * 1. FIND POSITIONS THAT REACHED STAGE
         * =========================
         */
        const reachedRecords = await this.model.aggregate([

            {
                $match: {
                    talentId: talentIdObj,
                    stageType
                }
            },

            /**
             * prevent duplicates
             */
            {
                $sort: {
                    createdDate: -1
                }
            },

            {
                $group: {
                    _id: "$positionId",
                    record: {
                        $first: "$$ROOT"
                    }
                }
            }
        ]);

        if (!reachedRecords?.length) {
            return {
                items: [],
                totalItems: 0,
                page,
                size
            };
        }

        let uniqueRecords = reachedRecords.map(r => r.record);

        /**
         * =========================
         * 2. FILTERS
         * =========================
         */
        if (filters?.length) {
            uniqueRecords = uniqueRecords.filter(r => {
                return filters.every(f => {
                    const val = (r as any)[f.property];
                    return val === f.value;
                });
            });
        }

        /**
         * =========================
         * 3. SORTING
         * =========================
         */
        if (sort && Object.keys(sort).length > 0) {

            const [[field, order]] = Object.entries(sort);

            uniqueRecords.sort((a, b) => {

                const aVal = (a as any)[field];
                const bVal = (b as any)[field];

                if (aVal < bVal) {
                    return order === 1 ? -1 : 1;
                }

                if (aVal > bVal) {
                    return order === 1 ? 1 : -1;
                }

                return 0;
            });
        }

        const total = uniqueRecords.length;

        /**
         * =========================
         * 4. PAGINATION
         * =========================
         */
        const paginatedRecords =
            uniqueRecords.slice(offset, offset + limit);

        /**
         * =========================
         * 5. ENRICH
         * =========================
         */
        const positions = await Promise.all(
            paginatedRecords.map(r =>
                this.positionsService.getByIdAsync(r.positionId)
            )
        );

        const enrichedRecords: EnrichedAppliedPositionsProgress[] =
            paginatedRecords
                .map((r, index) => {

                    const position = positions[index];

                    if (!position) {
                        return null;
                    }

                    return {
                        _id: r._id?.toString(),
                        positionId: r.positionId?.toString(),
                        positionOwner: position.createdBy.toString(),
                        appliedDate: r.createdDate,
                        positionName: position.title,
                        positionStatus: position.status,
                        companyName:
                            position?.positionDetails?.company?.data?.companyName || '',
                        companyId:
                            position?.positionDetails?.company?._id?.toString() || '',
                        currentStage: r.stageName,
                        currentStageType: r.stageType,
                        currentStageStatus: r.status
                    };
                })
                .filter(Boolean) as EnrichedAppliedPositionsProgress[];

        return {
            items: enrichedRecords,
            totalItems: total,
            page,
            size
        };
    }

    async getAppliedPositionIds(talentId: string): Promise<string[]> {
        const talentIdObj = new ObjectId(talentId);

        const records = await this.model.aggregate([
            { $match: { talentId: talentIdObj } },
            {
                $group: {
                    _id: "$positionId",
                }
            }
        ]);

        return records.map(r => r._id.toString());
    }

    async getTalentsContactsListByPositions(userId: any): Promise<Record<string, IContact[]>> {
        const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
        const records = await this.model.aggregate([
            { $match: { userId: userIdObj } },
            { $sort: { createdDate: -1 } },
            {
                $group: {
                    _id: {
                        talentId: "$talentId",
                    },
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } }
        ]);

        const values = await this.model.distinct("talentId", { userId: userIdObj });
        const photoURL = await this.profilePhotoService.getMainPhotoURLMap(values);
        const grouped: Record<string, IContact[]> = records.reduce((acc, record) => {
            const pid = record.positionId.toString();

            const talentContacts: IContact = {
                contactId: record.talentId.toString(),
                contactName: record.talentName,
                photoUrl: photoURL.get(record.talentId)
            };

            if (!acc[pid]) {
                acc[pid] = [];
            }

            if (!acc[pid].includes(talentContacts)) {
                acc[pid].push(talentContacts);
            }

            return acc;
        }, {} as Record<string, IContact[]>);

        return grouped;
    }

    async getTalentsContactsByPositionId(positionId: any): Promise<IContact[]> {
        const positionIdObj = typeof positionId === 'string' ? new ObjectId(positionId) : positionId;

        const records = await this.model.aggregate([
            { $match: { positionId: positionIdObj } },
            { $sort: { createdDate: -1 } },
            {
                $group: {
                    _id: { talentId: "$talentId" },
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } }
        ]);

        const values = await this.model.distinct("talentId", { positionId: positionIdObj });
        const photoURL = await this.profilePhotoService.getMainPhotoURLMap(values);

        const contacts: IContact[] = records.map(record => ({
            contactId: record.talentId.toString(),
            contactName: record.talentName,
            photoUrl: photoURL.get(record.talentId.toString())
        }));

        return contacts;
    }

    async getAllTalentsContactsByRecruiterId(recruiterId: any): Promise<IContact[]> {
        const recruiterIdObj = typeof recruiterId === 'string' ? new ObjectId(recruiterId) : recruiterId;

        const records = await this.model.aggregate([
            { $match: { userId: recruiterIdObj } },
            { $sort: { createdDate: -1 } },
            {
                $group: {
                    _id: { talentId: "$talentId" },
                    doc: { $first: "$$ROOT" }
                }
            },
            { $replaceRoot: { newRoot: "$doc" } }
        ]);
        const values = await this.model.distinct("talentId", { userId: recruiterIdObj });
        const photoURL = await this.profilePhotoService.getMainPhotoURLMap(values);

        const contacts: IContact[] = records.map(record => ({
            contactId: record.talentId.toString(),
            contactName: record.talentName,
            photoUrl: photoURL.get(record.talentId.toString()) 
        }));

        return contacts;
    }

    private mapStageNameToType(name: string): StageType {
        console.log('Mapping stage name to type:', name);

        const normalized = (name ?? '').trim().toLowerCase();

        switch (normalized) {

            case 'sourced':
                return StageType.DEFAULT;

            case 'applied':
                return StageType.CV_REVIEW;

            case 'screening':
                return StageType.SCREENING;

            case 'assessment':
                return StageType.ASSESSMENT;

            case 'interview':
                return StageType.INTERVIEW;

            case 'offer':
                return StageType.OFFER;

            case 'hired':
                return StageType.FINAL;

            default:
                return StageType.DEFAULT;
        }
    }
}