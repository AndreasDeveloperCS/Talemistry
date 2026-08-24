import { Request } from 'express';

declare module 'express-serve-static-core' {
    interface Request {
        accessFilter?: Filtering;
        publicAccessFilter?: Filtering;
        ownerAccessFilter?: Filtering;
        sharedReadAccessFilter?: Filtering;
        sharedEditAccessFilter?: Filtering;
        rawBody?: string;
    }
}