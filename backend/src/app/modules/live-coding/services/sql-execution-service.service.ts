import { Injectable } from '@nestjs/common';
import Database from 'better-sqlite3';
import { SqlExecutionContext, SqlTable } from '../models/sql-execution-context';
import { SqlResult } from '../models/sql-result';

@Injectable()
export class SqlExecutionService {
    public executeSql(
        query: string,
        context: SqlExecutionContext,
        onData: (data: string) => void
    ) {
        try {
            const started = Date.now();
            const db = new Database(':memory:');
            for (const table of context.tables) {
                this.createTable(db, table);
                this.insertRows(db, table);
            }
            const result = db.prepare(query).all();
            const executionTime = Date.now() - started;
            const response: SqlResult = {
                success: true,
                result,
                rowCount: result.length,
                executionTime: executionTime,
                queryType: this.getQueryType(query),
                affectedRows: undefined,
                passed: undefined
            };

            if (context.validateResult && context.testCases?.length) {
                response.passed = this.compareSqlResults(
                    result,
                    context.testCases[0].expectedResult
                );
            }

            onData(JSON.stringify(response));
            db.close();
        } catch (err: any) {
            onData(JSON.stringify({ success: false, error: err.message }, null, 2));
        }
    }

    private compareSqlResults(actual: any[], expected: any[]): boolean {
        if (actual.length !== expected.length) {
            return false;
        }
        const normalize = (row: any) => JSON.stringify(Object.entries(row).sort());
        const actualNorm = actual.map(normalize).sort();
        const expectedNorm = expected.map(normalize).sort();
        return JSON.stringify(actualNorm) === JSON.stringify(expectedNorm);
    }

    private createTable(db: Database.Database, table: SqlTable) {
        const columns = table.columns
            .map(c => {
                let sql = `${c.name} ${c.type}`;
                if (c.primaryKey) {
                    sql += ' PRIMARY KEY';
                }
                if (c.autoIncrement) {
                    sql += ' AUTOINCREMENT';
                }

                if (!c.nullable) {
                    sql += ' NOT NULL';
                }
                return sql;
            })
            .join(',');
        db.exec(`CREATE TABLE ${table.name} (${columns})`);
    }
    private insertRows(db: Database.Database, table: SqlTable) {
        for (const row of table.rows) {
            const columns = table.columns.filter(c => !c.autoIncrement).map(c => c.name);
            const placeholders = columns.map(() => '?').join(',');
            const stmt = db.prepare(
                `INSERT INTO ${table.name}
                (${columns.join(',')})
                VALUES(${placeholders})`
            );
            stmt.run(...columns.map(c => row[c]));
        }
    }

    private getQueryType(query: string): string {
        return query.trim().split(/\s+/)[0].toUpperCase();
    }
}