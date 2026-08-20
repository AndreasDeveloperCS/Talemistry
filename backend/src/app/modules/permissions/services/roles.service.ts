import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Role, RoleDocument } from '../models/role';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BaseService } from '../../base/services/base.service';
import { Repository } from 'typeorm';
import { ROLES } from '../../../common/enums';

@Injectable()
export class RolesService extends BaseService<Role> {
    constructor(
        @InjectModel(Role.name)
        protected readonly model: Model<RoleDocument>,

        @InjectRepository(Role)
        protected readonly repository: Repository<Role>

    ) {
        super(model, repository);
    }

    async getMaxRegisterValue(): Promise<number> {
        const maxRole = await this.model.findOne().sort({ registerValue: -1 }).exec();
        return maxRole?.registerValue ?? 0;
    }

    async getRolesByCode(code: string): Promise<Role> {
        const role = await this.model.findOne({ code: code });
        return role;
    }

    async getRolesAsEnum(): Promise<ROLES> {
        const roles = await this.model.find().exec();
        const roleEnum = roles.reduce((acc, role) => {
            acc[role.code.toUpperCase()] = role.description;
            return acc;
        }, {} as ROLES);

        return roleEnum;
    }
}