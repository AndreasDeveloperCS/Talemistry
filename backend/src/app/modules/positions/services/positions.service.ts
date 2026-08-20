import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { In, Not, Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { IOpenPosition } from '../../communication/models/chat-message-payload';
import { TalentPipelineProgressService } from '../../position-pipelines/services/talent-pipeline-progress.service';
import { HrDashboardStats } from '../interfaces/hr-dashboard-stats.interface';
import { OpenPosition, OpenPositionDocument } from '../models/open-position';
import { PositionStatus } from '../models/position-item';
import { MeetingsService } from '../../meetings/services/meetings.service';
import { StageType } from '../../position-pipelines/models/pipeline-stage';
import { PipelineHealthStats } from '../interfaces/pipeline-health-stats.interface';
import { TalentProfileService } from '../../profiles/services/talent-profile.service';
import { User } from '../../users/models/user';
import { PositionMatchResult } from '../interfaces/position-match.interface';
import { PositionsLikedService } from './positions-liked.service';
import { PaginatedResource, Pagination } from '../../../helpers/pagination';
import { Filtering, FilterRule } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';

@Injectable()
export class PositionsService extends BaseService<OpenPosition>{

  constructor(
    @InjectModel(OpenPosition.name)
    protected readonly model: Model<OpenPositionDocument>,

    @InjectRepository(OpenPosition)
    protected readonly repository: Repository<OpenPosition>,

    @Inject(forwardRef(() => TalentPipelineProgressService))
    protected readonly talentPipelineProgressService: TalentPipelineProgressService,
    
    protected readonly meetingsService: MeetingsService,
    protected readonly profileService: TalentProfileService,
    private positionsLikedService: PositionsLikedService,
  ) {
    super(model, repository);
  }

  async getByUserIdAsync(userId: any): Promise<IOpenPosition[] | null> {
    const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;
    const positions = await this.repository.find({
      select: ['_id', 'title'], 
      where: { userId: userIdObj },
    });

    return positions.map(p => ({
      positionId: p._id.toString(),
      positionName: p.title,
    }));
  }

  async getByIds(ids: ObjectId[]) {
    const result = await this.model.find({
      _id: { $in: ids } 
    }).select('_id title');
    return result;
  }

  async getHrDashboardStats(userId: ObjectId, email: string): Promise<HrDashboardStats> {

    const userIdObj =
      typeof userId === 'string'
        ? new ObjectId(userId)
        : userId;

    console.log('Fetching HR dashboard stats for', userIdObj);

    // 1. Get positions
    const positions =
      await this.repository.find({
        where: { userId: userIdObj }
      });

    console.log('Positions loaded:', positions.length);

    const active = positions.filter(p => p.status === PositionStatus.ACTIVE).length;
    const closed = positions.filter(p => p.status === PositionStatus.CLOSED).length;
    const draft = positions.filter(p => p.status === PositionStatus.DRAFT).length;
    const paused = positions.filter(p => p.status === PositionStatus.PAUSED).length;

    // 2. Get candidates (unique)
    const pipelineRecords =
      await this.talentPipelineProgressService.getTalentPipelineByUserId(userId);

    const interviews =
      pipelineRecords.filter(
        r => r.stageType === StageType.INTERVIEW
      ).length;

    const offers =
      pipelineRecords.filter(
        r => r.stageType === StageType.OFFER
      ).length;

    const hires =
      pipelineRecords.filter(
        r => r.stageType === StageType.FINAL
      ).length;

    const uniqueCandidates = new Set(
      pipelineRecords.map(r => r.talentId.toString())
    );

    const now = new Date();
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(now.getDate() - 14);

    const currentWeekCandidates =
      pipelineRecords.filter(
        r => new Date(r.createdDate) >= oneWeekAgo
      ).length;

    const previousWeekCandidates =
      pipelineRecords.filter(r => {

        const created = new Date(r.createdDate);

        return created >= twoWeeksAgo
          && created < oneWeekAgo;

      }).length;

    const candidatesDeltaWeek =
      calcDelta(
        currentWeekCandidates,
        previousWeekCandidates
      );

    // Today
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date(now);
    endOfToday.setHours(23, 59, 59, 999);

    // Week
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);

    // Month
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [today, week, month, total] = await Promise.all([
      this.meetingsService.countMeetingsByEmailAndRange(email, startOfToday, endOfToday),

      this.meetingsService.countMeetingsByEmailAndRange(email, startOfWeek),

      this.meetingsService.countMeetingsByEmailAndRange(email, startOfMonth),

      this.meetingsService.countMeetingsByEmailAndRange(email)
    ]);

    const currentWeekInterviews =
      pipelineRecords.filter(r => {

        return r.stageType === 'interview'
          && new Date(r.createdDate) >= oneWeekAgo;

      }).length;

    const previousWeekInterviews =
      pipelineRecords.filter(r => {

        const created = new Date(r.createdDate);

        return r.stageType === 'interview'
          && created >= twoWeeksAgo
          && created < oneWeekAgo;

      }).length;

    const interviewsDeltaWeek =
      calcDelta(
        currentWeekInterviews,
        previousWeekInterviews
      );

    const newPositionsThisWeek =
      positions.filter(
        p => new Date(p.createdDate) > oneWeekAgo
      ).length;
    
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const newPositionsThisMonth =
      positions.filter(
        p => new Date(p.createdDate) > oneMonthAgo
      ).length;
    
    const addedCandidatesThisWeek =
      pipelineRecords.filter(
        r => new Date(r.createdDate) > oneWeekAgo
      ).length;
    
    const addedCandidatesThisMonth =
      pipelineRecords.filter(
        r => new Date(r.createdDate) > oneMonthAgo
      ).length;

    const currentWeekPositions =
      positions.filter(
        p => new Date(p.createdDate) > oneWeekAgo
      ).length;

    const previousWeekStart = new Date(oneWeekAgo);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);

    const previousWeekPositions =
      positions.filter(p => {
        const created = new Date(p.createdDate);

        return created >= previousWeekStart
          && created < oneWeekAgo;
      }).length;

    const positionsDeltaWeek =
      calcDelta(
        currentWeekPositions,
        previousWeekPositions
      );

    return {

      positions: {
        active,
        closed,
        draft,

        newThisWeek: newPositionsThisWeek,
        newThisMonth: newPositionsThisMonth
      },

      candidates: {
        total: uniqueCandidates.size,

        addedThisWeek: addedCandidatesThisWeek,
        addedThisMonth: addedCandidatesThisMonth
      },

      meetings: {
        today,
        week,
        month,
        total
      },

      pipeline: {
        interviews,
        offers,
        hires
      },

      trends: {
        positionsDeltaWeek,
        candidatesDeltaWeek,
        interviewsDeltaWeek
      }
    };
  }

  async getTopPositionMatches(requestingUser: User): Promise<PositionMatchResult[]> {
    const profile = await this.profileService.getPublicProfile(requestingUser._id, requestingUser);

    if (!profile) {
      return [];
    }

    const candidateSkills = [
      ...(profile.hardSkills || []),
      ...(profile.softSkills || []),
      ...(profile.domainSkills || []),
      ...(profile.managerialSkills || []),
      ...(profile.languagesSkills || [])
    ]
    .map((skill: any) => {
      if (typeof skill === 'string') {
        return skill.toLowerCase().trim();
      }
      return skill?.skillName ?.toLowerCase() ?.trim();
    })
    .filter(Boolean);

    const uniqueCandidateSkills = [...new Set(candidateSkills)];
    const appliedPositionIds = await this.talentPipelineProgressService.getAppliedPositionIds(requestingUser._id.toString());
    const appliedObjectIds = appliedPositionIds.map(id => new ObjectId(id));
    const positions = await this.model.aggregate([
      {
        $match: {
          status: PositionStatus.ACTIVE,
          isVerified: true,
          _id: {
            $nin: appliedObjectIds
          }
        }
      }
    ]);

    const matchedPositions = positions.map((position: OpenPosition) => {
      const positionSkills = position?.positionDetails?.requirements?.positionSkills || [];
      const normalizedPositionSkills = positionSkills.map((skill: any) => skill?.skillName ?.toLowerCase() ?.trim()).filter(Boolean);
      const matchedSkills = normalizedPositionSkills.filter((skill: string) => uniqueCandidateSkills.includes(skill));
      const totalRequiredSkills = normalizedPositionSkills.length;
      const matchedSkillsCount = matchedSkills.length;
      const matchPercentage = totalRequiredSkills ? Math.round((matchedSkillsCount / totalRequiredSkills) * 100) : 0;
      return {
        positionId: position._id,
        title: position.title,
        companyId: position?.positionDetails?.company?._id,
        companyName: position?.positionDetails?.company?.data?.companyName,
        matchPercentage,
        matchedSkills,
        missingSkills: normalizedPositionSkills.filter((skill: string) => !matchedSkills.includes(skill)),
        matchedSkillsCount,
        totalRequiredSkills,
      };
    }).filter(item => item.matchedSkillsCount > 0)
    .sort((a, b) => b.matchPercentage - a.matchPercentage)
    .slice(0, 20);

    return matchedPositions;
  }

  async getPipelineHealthStats(
      userId: ObjectId
  ): Promise<PipelineHealthStats> {

      const userIdObj = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const positions =
          await this.repository.find({
              where: {
                  userId: userIdObj
              }
          });

      const pipelineRecords =
          await this.talentPipelineProgressService
              .getTalentPipelineByUserId(
                  userIdObj
              );

      const stageOrder = [

          StageType.DEFAULT,

          StageType.CV_REVIEW,

          StageType.SCREENING,

          StageType.ASSESSMENT,

          StageType.INTERVIEW,

          StageType.OFFER,

          StageType.FINAL
      ];

      const stageLabels = {

          [StageType.DEFAULT]:
              'Applied',

          [StageType.CV_REVIEW]:
              'CV Review',

          [StageType.SCREENING]:
              'Screening',

          [StageType.ASSESSMENT]:
              'Assessment',

          [StageType.INTERVIEW]:
              'Interview',

          [StageType.OFFER]:
              'Offer',

          [StageType.FINAL]:
              'Hired'
      };

      const stageColors = {

        [StageType.DEFAULT]:
            '#ea580c',

        [StageType.CV_REVIEW]:
            '#f97316',

        [StageType.SCREENING]:
            '#fb923c',

        [StageType.ASSESSMENT]:
            '#fdba74',

        [StageType.INTERVIEW]:
            '#fed7aa',

        [StageType.OFFER]:
            '#ffedd5',

        [StageType.FINAL]:
            '#fff7ed'
    };

      const funnel = [];

      let previousCount = 0;

      for (const stageType of stageOrder) {

          const count =
              pipelineRecords.filter(
                  x => x.stageType === stageType
              ).length;

          const conversion =
              previousCount === 0
                  ? 100
                  : Math.round(
                      (count / previousCount) * 100
                  );

          funnel.push({

              stage:
                  stageLabels[stageType],

              stageType,

              count,

              conversion,

              color:
                  stageColors[stageType]
          });

          previousCount = count;
      }

      const interviews =
          funnel.find(
              x => x.stageType === StageType.INTERVIEW
          )?.count || 0;

      const offers =
          funnel.find(
              x => x.stageType === StageType.OFFER
          )?.count || 0;

      const hires =
          funnel.find(
              x => x.stageType === StageType.FINAL
          )?.count || 0;

      const offerAcceptance =
          offers > 0
              ? Math.round(
                  (hires / offers) * 100
              )
              : 0;

      const interviewToHire =
          interviews > 0
              ? Math.round(
                  (hires / interviews) * 100
              )
              : 0;

      const totalApplied =
          funnel[0]?.count || 0;

      const dropoffRate =
          totalApplied > 0
              ? 100 -
                Math.round(
                  (hires / totalApplied) * 100
                )
              : 0;

      const avgTimeToHire = 18;

      const kpis = [

          {
              label: 'Offer Acceptance',
              value: `${offerAcceptance}%`,
              icon: 'handshake'
          },

          {
              label: 'Time To Hire',
              value: `${avgTimeToHire}d`,
              icon: 'schedule'
          },

          {
              label: 'Interview → Hire',
              value: `${interviewToHire}%`,
              icon: 'insights'
          },

          {
              label: 'Dropoff Rate',
              value: `${dropoffRate}%`,
              icon: 'trending_down'
          }
      ];

      const bottlenecks = [];

      for (let i = 1; i < funnel.length; i++) {

          const previous =
              funnel[i - 1];

          const current =
              funnel[i];

          if (!previous.count) {
              continue;
          }

          const loss =
              100 -
              Math.round(
                  (current.count / previous.count) * 100
              );

          bottlenecks.push({

              stage:
                  `${previous.stage} → ${current.stage}`,

              loss: `${loss}%`,

              avgDays:
                  Math.floor(Math.random() * 10) + 2
          });
      }

      bottlenecks.sort((a, b) =>
          parseInt(b.loss) -
          parseInt(a.loss)
      );

      const topPositions = positions
          .slice(0, 5)
          .map(position => {

              const hiresCount =
                  pipelineRecords.filter(
                      x =>
                          x.positionId?.toString() ===
                          position._id.toString()

                          &&

                          x.stageType === StageType.FINAL
                  ).length;

              return {
                  id: position._id,
                  title: position.title,
                  hires: hiresCount,
                  status: hiresCount >= 3 ? 'Healthy' : hiresCount >= 1 ? 'Growing' : 'Slow Pipeline'
              };
          });

      const insights = [];

      if (offerAcceptance >= 50) {

          insights.push(
              'Offer acceptance rate is performing above average.'
          );
      }

      if (dropoffRate >= 70) {

          insights.push(
              'Candidate dropoff is high across the funnel.'
          );
      }

      if (interviewToHire >= 20) {

          insights.push(
              'Interview conversion quality is strong.'
          );
      }

      const worstStage =
          bottlenecks[0];

      if (worstStage) {

          insights.push(
              `${worstStage.stage} has the highest funnel loss.`
          );
      }

      return {

          funnel,

          kpis,

          bottlenecks:
              bottlenecks.slice(0, 3),

          topPositions,

          insights
      };
  }

  async getAllSavedAsync(
    user: User,
    pagination: Pagination,
    sort?: Sorting,
    filters: Filtering = []
  ): Promise<PaginatedResource<Partial<OpenPosition>>> {
    const likedIds = await this.positionsLikedService.getLikedPositionIds(
      new ObjectId(user._id)
    );

    if (!likedIds.length) {
      return {
        totalItems: 0,
        items: [],
        page: pagination.page,
        size: pagination.size,
      };
    }

    filters.push({
      property: '_id',
      rule: FilterRule.IN,
      value: likedIds,
    });

    filters.push({
      property: 'isVerified',
      rule: FilterRule.EQUALS,
      value: true,
    });

    return this.getAllAsync(pagination, sort, filters,);
  }
}

function calcDelta(current: number, previous: number): number {

  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(
    ((current - previous) / previous) * 100
  );
}