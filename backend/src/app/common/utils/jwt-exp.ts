import type { SignOptions } from 'jsonwebtoken';
import type { StringValue } from 'ms';

export function parseJwtExpires(
    value: string | undefined,
    fallback: StringValue | number = '1h'
): StringValue | number {
    if (!value) return fallback;
    const n = Number(value);
    return Number.isFinite(n) ? n : (value as StringValue);
}