import { Connection } from 'mongoose';
export interface LiveFilters {
    range: string;
    viewerId: string;
    recruiterId: string;
    skill: string;
}
export declare class LiveAnalyticsService {
    private readonly connection;
    constructor(connection: Connection);
    private col;
    overview(f: LiveFilters): Promise<{
        ok: boolean;
        meta: {
            source: string;
            totalRecords: number;
            scopedRecords: number;
            skillApplied: boolean;
            generatedAt: string;
        };
        scopeLabel: string;
        kpis: {
            applications: {
                value: string;
                delta: string;
                positive: boolean;
            };
            conversion: {
                value: string;
                delta: string;
                positive: boolean;
            };
            timeToHire: {
                value: string;
                delta: string;
                positive: boolean;
            };
            quality: {
                value: string;
                delta: string;
                positive: boolean;
            };
        };
        trend: {
            label: string;
            applicants: number;
            hires: number;
        }[];
        tth: {
            label: string;
            days: number;
        }[];
        funnel: {
            label: string;
            value: number;
            color: string;
        }[];
        recruiters: {
            id: string;
            name: string;
            role: string;
            filled: number;
            timeToHire: number;
            assessment: number;
            velocity: number;
        }[];
        filterOptions: {
            recruiters: {
                id: string;
                name: string;
                role: string;
            }[];
            skills: {
                key: string;
                label: string;
            }[];
            viewers: {
                id: string;
                name: string;
                role: string;
            }[];
        };
    }>;
}
