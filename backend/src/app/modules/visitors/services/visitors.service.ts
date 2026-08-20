import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere } from 'typeorm';
import { Repository, UpdateOptions } from 'typeorm';
import { Visitor, VisitorDocument } from '../models/visitor';
import { BaseService } from '../../base/services/base.service';
import { Pagination } from '../../../helpers/pagination';
import { Filtering } from '../../../helpers/filtering';
import { getComplexWhere } from '../../../helpers/orm';
import { Sorting } from '../../../helpers/sorting';
import { FilterQuery, Model, PipelineStage } from 'mongoose';

@Injectable()
export class VisitorsService extends BaseService<Visitor> {

  constructor(
    @InjectModel(Visitor.name)
    protected readonly model: Model<VisitorDocument>,

    @InjectRepository(Visitor)
    protected readonly repository: Repository<Visitor>
  ) {
    super(model, repository);
  }

  async unifyDateTimeVisitFormat() {
    // Find all records where dateTimeVisit is stored as a string

    try {
      // const recordsToUpdate1 = await this.model.find({
      //   dateTimeVisit: { $type: "string" },
      // }).exec();
      //   await this.model.updateMany(
      //     { dateTimeVisit: { $type: "string" } }, // Only target string dates
      //     [
      //       {
      //         $set: {
      //           dateTimeVisit: {
      //             $convert: { input: "$dateTimeVisit", to: "date", onError: "$dateTimeVisit" }
      //           }
      //         }
      //       }
      //     ]
      //   ).exec();

      const recordsToUpdate = await this.model.find({
        dateTimeVisit: { $type: "string" },
      }).exec();
      // console.log('unifyDateTimeVisitFormat', recordsToUpdate.length);
      // Loop through each record, convert dateTimeVisit to Date, and update
      // for (const record of recordsToUpdate) {
      //   const dateString = record.dateTimeVisit;
      //   const date = new Date(dateString);
      //    // console.log('unifyDateTimeVisitFormat date', date);  
      //   // Update the record if date conversion is valid
      //   if (!isNaN(date.getTime())) {
      //     await this.model.updateOne(
      //       { _id: record._id },
      //       { $set: { dateTimeVisit: date } }
      //     ).exec();
      //   } else {
      //     console.error(`Invalid date string: ${dateString}`);
      //   }
      // }
      // console.log('unifyDateTimeVisitFormat', recordsToUpdate.length);
    } catch (error) {
      console.error(error);
    }

  }
  async bulkUpdate(ids: any[]) {
    const bulkOperations = ids.map((record: any) => ({
      updateMany: {
        filter: { ip: record._id.ip },
        update: { $set: { frequency: record.count } },
      }
    }));

    const result = await this.model.bulkWrite(bulkOperations);
    return result;
  }

  async bulkPatch(ip: string, frequency: number) {
    const bulkOperations = [{
      updateMany: {
        filter: { ip: ip },
        update: { $set: { frequency } },
      }
    }];
    const result = await this.model.bulkWrite(bulkOperations);
    return result;
  }

  public async getIps() {

    const aggregationPipeline: PipelineStage[] = [
      {
        $group: {
          _id: {
            ip: '$ip',
            region: '$regionName',
            country: '$country',
            city: '$city',
          }, // Column for which you want unique values
          count: { $sum: 1 }, // Optionally count occurrences
        },
      },
      {
        $sort: {
          count: 1, // Sort by count in descending order (-1 for descending)
        },
      },
    ];

    const result = await this.model.aggregate(aggregationPipeline);

    return result;
  }

  public async getRegionNames() {

    const aggregationPipeline: PipelineStage[] = [
      {
        $group: {
          _id: {
            // ip: '$ip',
            region: '$regionName',
            country: '$country',
            // city: '$city',
          }, // Column for which you want unique values
          count: { $sum: 1 }, // Optionally count occurrences
        },
      },
      {
        $sort: {
          count: 1, // Sort by count in descending order (-1 for descending)
        },
      },
    ];

    const result = await this.model.aggregate(aggregationPipeline);

    return result;
  }

  public async getCities() {

    const aggregationPipeline: PipelineStage[] = [
      {
        $group: {
          _id: {
            // ip: '$ip',
            region: '$regionName',
            country: '$country',
            city: '$city',
          }, // Column for which you want unique values
          count: { $sum: 1 }, // Optionally count occurrences
        },
      },
      {
        $sort: {
          _id: 1, // Sort by count in descending order (-1 for descending)
        },
      },
    ];

    const result = await this.model.aggregate(aggregationPipeline);

    return result;
  }

  public async getCountries({ page, limit, size, offset }: Pagination, sort?: Sorting, filter?: Filtering) {

    try {
      const where: FindOptionsWhere<any> = getComplexWhere(filter);

      const order = this.getOrder(sort);
      const match: FilterQuery<any> = where as unknown as FilterQuery<any>;
      const aggregationPipeline: PipelineStage[] = [
        {
          $match: match,
        },
        {
          $group: {
            _id: `$${'country'}`, // Column for which you want unique values
            count: { $sum: 1 }, // Optionally count occurrences
          },
        },
        {
          $sort: {
            _id: 1, // Sort by count in descending order (-1 for descending)
          },
        },
      ];

      const result = await this.model.aggregate(aggregationPipeline);
      return result;
    } catch (error) {
      console.error(error);
    }
  }


}
