export interface SqlTestCase {
  inputQuery?: string;     
  expectedResult: any[];  
}

export interface SqlExecutionContext {
  tables: SqlTable[];
  testCases: SqlTestCase[];
  validateResult?: boolean;
}

export interface SqlTable {
  name: string;
  columns: SqlColumn[];
  rows: SqlRow[];
}

export interface SqlColumn {
  name: string;
  type: SqlColumnType;
  nullable?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
}

export interface SqlRow {
  [column: string]: any;
}

export enum SqlColumnType {
  INTEGER = 'INTEGER',
  TEXT = 'TEXT',
  REAL = 'REAL',
  BLOB = 'BLOB',
  NUMERIC = 'NUMERIC'
}