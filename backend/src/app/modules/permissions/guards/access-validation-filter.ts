import { FindOptionsWhere } from "typeorm/find-options/FindOptionsWhere";
import { Filtering } from "../../../helpers/filtering";

export function buildMongoFilterFromCustom(filters: Filtering): any {
    const conditions = filters.map((filter) => {
        switch (filter.rule) {
            case 'eq':
                return { [filter.property]: filter.value };
            case 'ne':
                return { [filter.property]: { $ne: filter.value } };
            case 'in':
                return { [filter.property]: { $in: Array.isArray(filter.value) ? filter.value : [filter.value] } };
            case 'nin':
                return { [filter.property]: { $nin: Array.isArray(filter.value) ? filter.value : [filter.value] } };
            case 'gt':
                return { [filter.property]: { $gt: filter.value } };
            case 'lt':
                return { [filter.property]: { $lt: filter.value } };
            case 'regex':
                return { [filter.property]: { $regex: filter.value, $options: 'i' } };
            // Add more rules as needed
            default:
                return { [filter.property]: filter.value };
        }
    });

    return conditions.length > 0 ? { $or: conditions } : {};
}

export function matchesAccessFilter<T, W extends FindOptionsWhere<any>>(item: T, accessWhere: W): boolean {

    if (!accessWhere || !accessWhere.$or) {
        //console.log('matchesAccessFilter No access Where or no $or in accessWhere, allowing access', accessWhere);

        return true;
    }

    return accessWhere.$or.some((condition: Record<string, any>) => {
        //console.log(`${condition} matchesAccessFilter No access - Where or no $or in accessWhere, allowing access`);

        const getProperty = (obj: any, path: string) => {
            if (!obj || !path) return undefined;
            return path.split('.').reduce((acc: any, part: string) => acc && acc[part], obj);
        };

        return Object.entries(condition).every(([key, value]) => {
            const actual = getProperty(item as any, key);

            // If the actual value is an array, handle both primitive arrays
            // (e.g. sharedReadIds) and arrays of objects (e.g. participants).
            if (Array.isArray(actual)) {
                // Normalize matcher values
                const matchValues: any[] = [];
                if (value && typeof value === 'object') {
                    if ('$in' in value) matchValues.push(...(Array.isArray(value.$in) ? value.$in : [value.$in]));
                    else if ('$eq' in value) matchValues.push(value.$eq);
                    else matchValues.push(value);
                } else {
                    matchValues.push(value);
                }

                // If array contains primitives, match directly
                if (actual.length === 0 || typeof actual[0] !== 'object') {
                    return matchValues.some(mv => actual.some(a => a?.toString() === mv?.toString()));
                }

                // Otherwise array contains objects (participants) — check common fields
                return actual.some((entry: any) => {
                    try {
                        const entryUserId = entry?.userId?.toString && entry.userId.toString();
                        const entryEmail = entry?.email && String(entry.email).toLowerCase();
                        return matchValues.some(mv => {
                            if (mv == null) return false;
                            const mvStr = mv.toString().toLowerCase();
                            if (entryUserId && entryUserId.toLowerCase() === mvStr) return true;
                            if (entryEmail && entryEmail === mvStr) return true;
                            return false;
                        });
                    } catch {
                        return false;
                    }
                });
            }

            if (value && typeof value === 'object') {
                if ('$in' in value) {
                    return value.$in.some((v: any) => actual?.toString() === v.toString());
                }

                if ('$eq' in value) {
                    return actual?.toString() === value.$eq.toString();
                }

                return false;
            }

            return actual?.toString() === value?.toString();
        });
    });
}