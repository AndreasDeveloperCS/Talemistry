export function normalizeSocketBase(value: unknown): string {
    try {
        const raw = String(value ?? '').trim();
        if (!raw) return '';

        if (/^https?:\/\//i.test(raw)) {
            return new URL(raw).origin.replace(/\/+$/, '');
        }

        if (typeof window !== 'undefined' && window?.location?.origin) {
            return new URL(raw, window.location.origin).origin.replace(/\/+$/, '');
        }

        return raw.replace(/\/+$/, '');
    } catch {
        return String(value ?? '').trim().replace(/\/+$/, '');
    }
}

export function isJwtLike(value: unknown): boolean {
    const raw = String(value ?? '').trim();
    return /^[-A-Za-z0-9_=]+\.[-A-Za-z0-9_=]+(?:\.[-A-Za-z0-9_+=/]*)?$/.test(raw);
}