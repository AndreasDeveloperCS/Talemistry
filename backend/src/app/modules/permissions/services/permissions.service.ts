import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { ObjectId } from 'bson';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { BaseService } from '../../base/services/base.service';
import { Permission, PermissionDocument } from '../models/permission';
import { FunctionalBlocksService } from './functional-blocks.service';

@Injectable()
export class PermissionsService extends BaseService<Permission> {

    constructor(
        @InjectModel(Permission.name)
        protected readonly model: Model<PermissionDocument>,

        @InjectRepository(Permission)
        protected readonly repository: Repository<Permission>,

        protected readonly functionalBlockService: FunctionalBlocksService
    ) {
        super(model, repository);
    }

    async bulkUpdate(roleId: ObjectId, permissions: Permission[], userId: ObjectId) {
        const now = new Date();
        console.log('bulkUpdate', roleId, permissions, userId);
        const bulkOps = permissions.map(p => ({
            updateOne: {
                filter: {
                    roleId: roleId,
                    functionalBlockId: new ObjectId(p.functionalBlockId),
                },
                update: {
                    $set: {
                        roleCode: p.roleCode,
                        functionalBlockCode: p.functionalBlockCode,

                        bitMask: p.bitMask,
                        numberValue: p.numberValue,
                        isActive: p.isActive,

                        modifiedBy: userId,
                        modifiedDate: now,
                    },
                    $setOnInsert: {
                        roleId: roleId,
                        functionalBlockId: new ObjectId(p.functionalBlockId),
                        createdBy: userId,
                        createdDate: now
                    },
                    $setOnUpdate: {
                        roleCode: p.roleCode,
                        functionalBlockCode: p.functionalBlockCode,
                        modifiedBy: userId,
                        modifiedDate: now
                    }
                },
                upsert: true
            }
        }));

        const result = await this.model.bulkWrite(bulkOps);

        return {
            updatedCount: result.modifiedCount,
            upsertedCount: result.upsertedCount,
            matchedCount: result.matchedCount
        };
    }

    async getBitmaskByRoute(roleId: ObjectId, route: string): Promise<number> {
        //console.log('getBitmaskByRoute', route);
        const functionalBlock = await this.functionalBlockService.getBlockIdByRoute(route);
        const functionalBlockId = functionalBlock?._id;
        //console.log('blockId', functionalBlockId);
        const permission = await this.model.findOne({ roleId: roleId, functionalBlockId: functionalBlockId });
        //console.log('Permission', permission);
        //console.log('Permission.numberValue', permission?.numberValue);
        return permission?.numberValue || 0;
    }

    async getUserBitmask(roleId: ObjectId, blockId: ObjectId): Promise<number> {
        const permission = await this.model.findOne({
            role: roleId,
            functionalBlock: blockId,
        });

        return permission?.numberValue || 0;
    }

    async getPermissionsByRoleCode(roleCode: string): Promise<Permission[]> {
        const permissions = await this.model.find({
            roleCode: roleCode
        }).exec();

        return permissions;
    }


    async getPermissionsByRoleId(roleId: ObjectId): Promise<Permission[]> {
        // const permissions = await this.model.find({
        //     roleId: roleId
        // }).exec();
        const permissions = await this.repository.findBy({
            roleId: roleId
        });
        return permissions;
    }

}
