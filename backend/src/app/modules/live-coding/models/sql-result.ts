export interface SqlResult {
    success: boolean;
    result?: any[];
    rowCount?: number;
    executionTime?: number;
    queryType?: string;
    affectedRows?: number;
    error?: string;
    passed?: boolean;
}