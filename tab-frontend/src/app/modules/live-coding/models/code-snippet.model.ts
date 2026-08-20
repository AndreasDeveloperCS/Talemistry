import { BaseEntity } from "../../general/models/base-entity";
import { ProgrammingLanguage } from "./programming-language.enum";
import { SqlExecutionContext } from "./sql-execution-context";

export class CodeSnippet implements BaseEntity {
  _id?: any;
  title: string = '';
  code: string = '';
  language: ProgrammingLanguage | string = ProgrammingLanguage.JAVASCRIPT;
  sqlContext?: SqlExecutionContext;
  userId?: any;
  createdBy?: any;
  createdDate?: Date = new Date();
  modifiedBy?: any;
  modifiedDate?: Date = new Date();
}