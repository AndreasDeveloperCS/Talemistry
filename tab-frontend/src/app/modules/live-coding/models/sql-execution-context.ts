export interface SqlTestCase {
  inputQuery?: string;     
  expectedResult: any[];  
  validateResult?: boolean;
}

export interface SqlExecutionContext {
  tables: SqlTable[];
  testCases: SqlTestCase[];
}

export interface SqlTable {
  name: string;
  columns: SqlColumn[];
  rows: SqlRow[];
  isExpanded?: boolean;
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