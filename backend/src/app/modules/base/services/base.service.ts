import { FindOneOptions, FindOptionsWhere, Repository, UpdateResult } from "typeorm";
import { Filtering } from "../../../helpers/filtering";
import { PaginatedResource, Pagination } from "../../../helpers/pagination";
import { Sorting } from "../../../helpers/sorting";
import { Model } from "mongoose";
import { getComplexWhere, } from "../../../helpers/orm";
import { ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from "@nestjs/common";
import { IBaseModel } from "../models/base";
import { Request, Response } from 'express';
import { ObjectId } from "bson";
import { matchesAccessFilter } from "../../permissions/guards/access-validation-filter";

export interface IBaseService<T extends IBaseModel> {
  getAllAsync(
    { page, limit, size, offset }: Pagination,
    sort?: Sorting,
    userFilters?: Filtering,
    accessFilters?: Filtering,
  ): Promise<PaginatedResource<Partial<T>>>;

  getByIdAsync(id: any, accessFilters?: Filtering): Promise<T>;
  getRecordByValueAsync(column: string, ip: any): Promise<T>;
  createAsync(entity: T): Promise<T>;
  updateAsync(entity: T): Promise<T>;
  patchAsync(id: any, propertyName: string, propertyValue: any): Promise<T>;
  deleteAsync(id: any): Promise<T>;
}

@Injectable()
export class BaseService<T extends IBaseModel> implements IBaseService<T> {

  constructor(protected readonly model: Model<T & Document>,
    protected readonly repository: Repository<T>) {
  }

  getOrder(sort: Sorting): any {
    return sort ? { [sort.property]: sort.direction } : {}
  }

  async getRecordByValueAsync(column: string, ip: any): Promise<T> {
    const item = await this.repository.findOne({ [column]: ip });
    return item;
  }

  async findByMultipleFields(matchFields: Record<string, any>) {
    const query: Record<string, any> = {};

    for (const [key, value] of Object.entries(matchFields)) {
      query[key] = value;
    }

    return await this.repository.findOne(query);
  }

  getCombinedConditions(userFilters, accessFilters) {

    if (accessFilters.length > 0) {
      const userWhere: FindOptionsWhere<any> = getComplexWhere(userFilters, "AND");
      const accessWhere: FindOptionsWhere<any> = getComplexWhere(accessFilters, "OR");
      //console.log('getAllAsync', userFilters, accessFilters);

      const where: FindOptionsWhere<any> = {
        $and: [
          ...(userWhere?.$and || userWhere?.$or ? [userWhere] : []),
          ...(accessWhere?.$or ? [{ $or: accessWhere.$or }] : [])
        ]
      };

      //console.log('getAllAsync where', accessFilters, userFilters);

      return where;
    } else {
      const userWhere: FindOptionsWhere<any> = getComplexWhere(userFilters, "AND");
      return userWhere;
    }
  }

  async getAllAsync({ page, limit, size, offset }: Pagination,
    sort?: Sorting,
    userFilters?: Filtering,
    accessFilters: Filtering = []): Promise<PaginatedResource<Partial<T>>> {

    //console.log('getAllAsync', userFilters, accessFilters);
    const where: FindOptionsWhere<any> = this.getCombinedConditions(userFilters, accessFilters);

    const order = this.getOrder(sort);
    //console.log('getAllAsync', where);

    try {
      const [selected, total] = await this.repository.findAndCount({
        where: where,
        order: order,
        take: limit,
        skip: offset,
      });
      return {
        totalItems: total,
        items: selected,
        page,
        size,
      };

    } catch (ex) {
      console.error(ex);
    }
  }

  async getByIdAsync(id: ObjectId | string, accessFilters: Filtering = []): Promise<T> {
    let _id: ObjectId = typeof id === 'string' ? new ObjectId(id) : id;
    //console.log('async getByIdAsync item before', id);
    const item = await this.model.findById(_id).exec();
    //console.log('async getByIdAsync item after', item);

    if (!item) {
      throw new NotFoundException(`${this.model.name} with ID "${id}" not found`);
    }

    const accessWhere = getComplexWhere(accessFilters, 'OR');

    //console.log('async getByIdAsync accessWhere', accessWhere);

    if (!matchesAccessFilter(item, accessWhere)) {
      throw new ForbiddenException(`Access to ${this.model.name} with ID "${id}" is forbidden. 
        Item: ${item}. Access Filers: ${JSON.stringify(accessFilters, null, 2)}. Access Where: ${JSON.stringify(accessWhere, null, 2)}.
        !matchesAccessFilter(item, accessWhere): ${!matchesAccessFilter(item, accessWhere)}`);
    }

    return item;
  }

  async createAsync(savingEntity: T): Promise<T> {
    const entity: T = savingEntity;

    const saving = new this.model(entity);

    const saved = await saving.save();

    return saved;
  }

  async updateAsync(entity: T): Promise<any> {
    const filter = { _id: entity._id };
    const id = entity._id;
    const updatingEntity: any = entity;
    console.log('updatingEntity', id, updatingEntity);
    updatingEntity.modifiedDate = new Date();

    delete updatingEntity._id;

    const update = {
      $set: updatingEntity,
    };

    const updatedEntity: UpdateResult = await this.repository.update(
      id,
      updatingEntity
    );

    console.log('updatedEntity', updatedEntity);

    if (!updatedEntity) {
      throw new NotFoundException(`Entity with ID "${entity._id}" not found`);
    }
    return updatedEntity;
  }

  async patchAsync(id: any, propertyName: string, propertyValue: any): Promise<T> {
    const options: FindOneOptions<T> = { where: { _id: id } };
    const where: FindOptionsWhere<T> = { _id: id };
    const itemModel = await this.model.findById(id);
    const itemRep = await this.repository.findOneBy({
      _id: id
    });

    if (!itemModel) {
      throw new NotFoundException(`${this.model.name} "${id}" not found`);
    }

    try {
      itemModel[propertyName] = propertyValue;
      if(propertyName !== 'modifiedDate') {
        itemModel['modifiedDate'] = new Date();
      }

      const updatedPost = await this.model.findByIdAndUpdate(id, { $set: itemModel }, { new: true }).exec();

      return updatedPost;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException('Error occurred while updating the entity');
    }
  }

  async deleteAsync(id: string | ObjectId): Promise<any> {
    try {
      if (!id) {
        throw new InternalServerErrorException('Error - ID is null or undefined');
      };
      const _id: any = id instanceof ObjectId ? id : new ObjectId(id);

      const deletedEntity = await this.repository.delete({ _id: _id });

      if (deletedEntity == undefined) {
        throw new NotFoundException(`${this.model.modelName} with ID "${id}" not found`);
      }
      return deletedEntity;
    } catch (ex) {
      console.error(`Error in deleteAsync service method: ${ex.message}`);
      throw new InternalServerErrorException('Error occurred while deleting the entity');
    }
  }

  getObjectId(id: any): ObjectId {
    let _id: ObjectId = typeof id === 'string' ? new ObjectId(id) : id;
    return _id;
  }
}