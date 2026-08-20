import {
    IsNull,
    Not,
    LessThan,
    LessThanOrEqual,
    MoreThan,
    MoreThanOrEqual,
    ILike,
    In,
    FindOptionsWhere,
    FindOperator
} from "typeorm";

import {
    CustomFilter,
    FilterRule,
    Filtering
} from "./filtering";

import {
    Sorting
} from "./sorting";
import { ObjectId } from "bson";

export const getOrder = (sort: Sorting) => sort ? { [sort.property]: sort.direction } : {};

export const getComplexWhere = (filtering: Filtering, logicOperator: 'AND' | 'OR' = 'AND'): FindOptionsWhere<any> => {

    if (!filtering) {
        return {};
    }

    const filters: FindOptionsWhere<any>[] = [];

    filtering.forEach((filter: CustomFilter) => {
        const filterCondition = getWhere(filter);
        filters.push(filterCondition);
    });

    //console.log('getComplexWhere', filtering, filters);

    const operator = logicOperator === 'AND' ? '$and' : '$or';
    const where: any = {
        [operator]: filters
    };
    //console.log('getComplexWhere operator', `${operator}`, where);

    return filters.length > 0 ? where : {};
}

export const getWhere = (filter: CustomFilter): FindOptionsWhere<any> => {

    if (!filter)
        return {};

    if (filter.rule == FilterRule.IS_NULL)
        return {
            [filter.property]: IsNull()
        };

    if (filter.rule == FilterRule.IS_NOT_NULL)
        return {
            [filter.property]: Not(IsNull())
        };

    if (filter.rule == FilterRule.EQUALS) {

        if (filter.property == '_id') {
            return {
                [filter.property]: new ObjectId(filter.value)
            }
        }
        if (filter.property.includes(`Id`) || filter.property.includes(`createdBy`)) {
            //console.log('filter.property.includes', filter);

            return {
                [filter.property]: new ObjectId(filter.value)
            }
        }
        if (typeof filter.value === 'string') {
            return {
                [filter.property]: {
                    $regex: filter.value
                }
            }
        }
        if (typeof filter.value === 'boolean') {
            return {
                [filter.property]: filter.value
            }
        }
    }

    if (filter.rule == FilterRule.NOT_EQUALS) {
        return {
            [filter.property]: {
                $neq: filter.value
            }
        }
    }

    if (filter.rule == FilterRule.GREATER_THAN) {

        if (!isNaN(filter.value)) {
            return {
                [filter.property]: {
                    $gt: filter.value
                }
            }
        }

        const date = new Date(filter.value);
        if (!isNaN(date.getTime())) {
            return {
                [filter.property]: {
                    $gt: `${date}`
                }
            }
        }
        if (typeof filter.value === 'string') {
            return {
                [filter.property]: {
                    $gt: filter.value
                }
            }
        }
    }

    if (filter.rule == FilterRule.GREATER_THAN_OR_EQUALS) {

        if (!isNaN(filter.value)) {
            return {
                [filter.property]: {
                    $gte: filter.value
                }
            }
        }

        const date = new Date(filter.value);

        if (!isNaN(date.getTime())) {
            return {
                [filter.property]: {
                    $gte: date //`${date}`
                }
            }
        }

        if (typeof filter.value === 'string') {
            return {
                [filter.property]: {
                    $gte: filter.value
                }
            }
        }
    }

    if (filter.rule == FilterRule.LESS_THAN) {

        if (!isNaN(filter.value)) {
            return {
                [filter.property]: {
                    $lt: filter.value
                }
            }
        }
        const date = new Date(filter.value);
        if (!isNaN(date.getTime())) {
            return {
                [filter.property]: {
                    $lt: `${date}`
                }
            }
        }
        if (typeof filter.value === 'string') {
            return {
                [filter.property]: {
                    $lt: filter.value
                }
            }
        }
    }

    if (filter.rule == FilterRule.LESS_THAN_OR_EQUALS) {

        if (!isNaN(filter.value)) {
            return {
                [filter.property]: {
                    $lte: filter.value
                }
            }
        }

        const date: Date = new Date(filter.value);

        if (!isNaN(date.getTime())) {

            return {
                [filter.property]: {
                    $lte: date // `${date}`
                }
            }
        }

        if (typeof filter.value === 'string') {
            return {
                [filter.property]: {
                    $lte: filter.value
                }
            }
        }

    }

    if (filter.rule == FilterRule.LIKE)
        return {
            [filter.property]: {
                $regex: `.*${filter.value}.*`,
                $options: 'i'
            }
        }

    // return { 
    //     [filter.property]: {
    //         value: ILike(`%${filter.value}%`),
    //         multipleParameters:true,
    //         $options: 'i' 
    //     }
    // };

    if (filter.rule == FilterRule.NOT_LIKE)
        return {
            [filter.property]: Not(ILike(`%${filter.value}%`))
        };

    // if (filter.rule == FilterRule.IN)
    //     return {
    //         [filter.property]: {
    //             $in: filter.value.split(',')
    //         }
    //     };

    if (filter.rule == FilterRule.IN) {
        return {
            [filter.property]: {
                $in: Array.isArray(filter.value)
                    ? filter.value  // already an array of ObjectId
                    : filter.value.split(',') // fallback if string
            }
        };
    }

    if (filter.rule == FilterRule.NOT_IN)
        return {
            [filter.property]:
            {
                $nin: filter.value.split(',')
            }
        };

}