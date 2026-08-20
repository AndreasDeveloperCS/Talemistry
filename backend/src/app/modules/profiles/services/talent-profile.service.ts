import { ForbiddenException, HttpException, HttpStatus, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { TalentProfile, TalentProfileDocument } from '../models/talent-profile';
import { getComplexWhere } from '../../../helpers/orm';
import { Filtering } from '../../../helpers/filtering';
import { matchesAccessFilter } from '../../permissions/guards/access-validation-filter';
import { UserDto } from '../../users/models/auth.dto';
import { ROLES } from '../../../common/enums';
import { ModuleRef } from '@nestjs/core';
import { UsersService } from '../../users/services/user.service';
import { MessageNotificationPreferences } from '../../communication/enums/communication-means.enum';
import { Skill } from '../../skills/models/skill';
import { ObjectId } from 'bson';
import { User } from '../../users/models/user';

@Injectable()
export class TalentProfileService extends BaseService<TalentProfile> {
  userService: any;

  private escapeRegex(value: string): string {
    return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  constructor(
    @InjectModel(TalentProfile.name)
    protected readonly model: Model<TalentProfileDocument>,

    @InjectRepository(TalentProfile)
    protected readonly repository: Repository<TalentProfile>,

    protected moduleRef: ModuleRef
  ) {
    super(model, repository);
    this.onModuleInit();

  }

  async onModuleInit() {
    if (this.moduleRef) {
      this.userService = await this.moduleRef.get(UsersService, { strict: false });
    }
  }

  async getExistingEntity(userId: any, entity: TalentProfile): Promise<TalentProfile> {

    try {
      //console.log('getExistingEntity', userId);
      const exisitingEntity: TalentProfile = await this.getByUserIdAsync(userId);
      //console.log('getExistingEntity', exisitingEntity);
      return exisitingEntity;
    } catch (error: any) {
      console.error(error);
      if (error instanceof NotFoundException) {

        const user: Readonly<UserDto> = {
          firstname: entity.user.firstname,
          lastname: entity.user.lastname,
          email: entity.user.email,
          phone: entity.user.phone,
          role: [ROLES.TALENT]
        }

        //console.log(user);
        const verificationRequest = await this.userService.registerUser(user);
        return await this.getByUserIdAsync(verificationRequest.userId);
      }
    }

  }

  async getByUserIdAsync(id: any, accessFilters: Filtering = []): Promise<TalentProfile> {
    const userId = this.getObjectId(id);
    //console.log('getByUserIdAsync', id);
    let item = await this.model.findOne({ userId: userId }).exec();
    //console.log('getByUserIdAsync', userId, item, accessFilters);

    if (!item) {
      item = await this.model.findOne({ userId: userId?.toString() }).exec();
    }
    if (!item) {
      return undefined;
    }

    const accessWhere = getComplexWhere(accessFilters, 'OR');
    //console.log('accessWhere info', accessWhere, matchesAccessFilter(item, accessWhere));
    if (!matchesAccessFilter(item, accessWhere)) {
      throw new ForbiddenException(`Access to ${this.model.name} with ID "${id}" is forbidden`);
    }

    return item;
  }

  async findByPseudonymExact(pseudonym?: string | null): Promise<TalentProfile[]> {
    const trimmedPseudonym = String(pseudonym || '').trim();
    if (!trimmedPseudonym) {
      return [];
    }

    const pseudonymMatcher = new RegExp(`^${this.escapeRegex(trimmedPseudonym)}$`, 'i');
    return this.model.find({ pseudonym: { $regex: pseudonymMatcher } }).exec();
  }

  async getSkillsByTalentIdsMap(
    talentIds: ObjectId[],
    requestingUser?: ObjectId,
  ): Promise<Map<string, Skill[]>> {
    if (!talentIds.length) {
      return new Map();
    }

    const profiles = await this.repository.find({
      where: {
        userId: { $in: talentIds },
      } as any,
    });

    const map = new Map<string, Skill[]>();

    for (const profile of profiles) {
      const userIdStr = profile.userId.toString();

      const isOwner =
        requestingUser &&
        profile.userId.toString() === requestingUser.toString();

      if (!profile.isPublic && !isOwner) {
        continue; // 🔒 private profile → skip
      }

      const skills: Skill[] = [
        ...(profile.hardSkills ?? []),
        ...(profile.softSkills ?? []),
        ...(profile.domainSkills ?? []),
        ...(profile.managerialSkills ?? []),
        ...(profile.languagesSkills ?? []),
      ];

      map.set(userIdStr, skills);
    }

    return map;
  }

  async deleteByUserIdAsync(userId: string | ObjectId): Promise<any> {
    try {
      const objectId = typeof userId === 'string' ? new ObjectId(userId) : userId;

      const result = await this.repository.delete([
        { userId: objectId },
        //{ userId: userId.toString() }
      ]);
      console.log('Delete user Profile res', result);

      return result;
    } catch (ex) {
      console.error(`Error in deleteByUserIdAsync service method: ${ex.message}`);
      return null;
    }
  }

  async getPublicProfile(id: string | ObjectId, requestingUser?: User): Promise<TalentProfile> {
      const userIdObj = typeof id === 'string' ? new ObjectId(id) : id;
      const talentProfile = await this.getByUserIdAsync(id);
      if (!talentProfile) {
        throw new HttpException('Profile not found.', HttpStatus.NOT_FOUND);
      }

      const isOwner = requestingUser && requestingUser._id?.toString() === id;

      if (!talentProfile.isPublic && !isOwner) {
          throw new HttpException('This profile is private and cannot be viewed.', HttpStatus.FORBIDDEN);
      }

      talentProfile.user = await this.userService.getByIdAsync(id);

      return talentProfile;
  }
}
