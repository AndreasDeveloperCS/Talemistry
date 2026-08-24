import { Injectable } from "@angular/core";

export class PaginatedResource<T> {
  totalItems: number = 0;
  items: T[] = [];
  page: number = 0;
  size: number = 10;
};

export interface Pagination {
  page: number;
  limit: number;
  size: number;
  offset: number;
}


export interface Sorting {
  property: string;
  direction: string;
}

export interface Filter {
  property?: string;
  rule: FilterRule;
  value: any;
}

export interface Filtering extends Array<Filter> { }

export enum FilterRule {
  EQUALS = 'eq',
  NOT_EQUALS = 'neq',
  GREATER_THAN = 'gt',
  GREATER_THAN_OR_EQUALS = 'gte',
  LESS_THAN = 'lt',
  LESS_THAN_OR_EQUALS = 'lte',
  LIKE = 'like',
  NOT_LIKE = 'nlike',
  IN = 'in',
  NOT_IN = 'nin',
  IS_NULL = 'isnull',
  IS_NOT_NULL = 'isnotnull',
}

export class LogsData {
  _id?: any;
  id?: any;
  openInfo: any;
  file: string = '';
  record_type: string = '';
  info_data: string = '';
  importance: number = 0;
  is_server: string = '';
  exception_data: string = '';
  created_at_utc: Date = new Date(Date.now());
  updated_at_utc: Date = new Date(Date.now());
}

@Injectable({
  providedIn: 'root'
})
export class SearchLogicService {
  public filterTooltip: string = "=,=>,=<,>,< or part of text";
  constructor() { }
  getPropertyType<T, K extends keyof T>(obj: T, key: K): T[K] {
    return obj[key];
  }
  getCustomFilter(column: string, rule: FilterRule, filterValue: any) {
    const newFilter: Filter = {
      property: column,
      rule: rule,
      value: filterValue
    }
    return newFilter;
  }
  getFilter(column: string, filterValue: any): Filter {
    const signs = ['<>', '>=', '<=', '=', '>', '<', '!='];

    const firstTwo: string = filterValue.length > 1 ? filterValue.substring(0, 2) : "";

    const firstSign = filterValue.length > 0 ? filterValue.charAt(0) : "";

    const isNotFileter = signs.includes(firstTwo) && filterValue.length == 2 || (signs.includes(firstSign) && filterValue.length == 1);

    if (isNotFileter) {
      return {
        property: column,
        rule: FilterRule.LIKE,
        value: filterValue
      };
    }

    const definedValue = (firstTwo == "<>" || firstTwo == ">=" || firstTwo == "<=" || firstTwo == "!=") ? filterValue.slice(2) :
      (firstSign == "=" || firstSign == ">" || firstSign == "<") ? filterValue.slice(1) : filterValue;

    const convertedValue: any = this.getRealValue(definedValue);

    const newFilter: Filter = {
      property: column,
      rule: firstTwo == "<>" ? FilterRule.NOT_LIKE :
        firstTwo == ">=" ? FilterRule.GREATER_THAN_OR_EQUALS :
          firstTwo == "<=" ? FilterRule.LESS_THAN_OR_EQUALS :
            firstTwo == "!=" ? FilterRule.NOT_EQUALS :
              firstSign == "=" ? FilterRule.EQUALS :
                typeof convertedValue == "boolean" ? FilterRule.EQUALS :
                  firstSign == ">" ? FilterRule.GREATER_THAN :
                    firstSign == "<" ? FilterRule.LESS_THAN :
                      definedValue == "NULL" ? FilterRule.IS_NULL :
                        filterValue == "!=NULL" ? FilterRule.IS_NOT_NULL :
                          FilterRule.LIKE,
      value: convertedValue
    };
    return newFilter;
  }

  getRealValue(input: any): string | number | Date | boolean {
    try {
      if (typeof input == "boolean") {
        return input;
      }
      if (input instanceof Date) {
        return input;
      }

      const number = +input;

      if (!Number.isNaN(number) && number != undefined) {
        // console.log(number);
        return number;
      }
      if (typeof input == "string") {
        return input;
      }

      // const date = new Date(input);
      // if(date) {
      //   return date;
      // }
    } catch (ex) {
      console.error(ex);
      return input;
    }
    return input;
  }
}
