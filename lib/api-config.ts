const sanitize = (value?: string | null) => {
    if (!value) return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

const withProtocol = (value: string) => {
    if (/^https?:\/\//i.test(value)) {
        return value;
    }
    return `https://${value}`;
};

const appendApiSegment = (value: string) => {
    if (/\/api(\/|$)/.test(value)) {
        return value.replace(/\/$/, '');
    }
    return `${value.replace(/\/$/, '')}/api`;
};

export const resolveApiBaseUrl = (): string => {
    // Check if we should use mock API mode
    const useMockApi = process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;

    if (useMockApi) {
        // Return a placeholder URL for mock mode - it won't be used
        return 'http://mock-api';
    }

    const explicitCandidates = [
        process.env.NEXT_PUBLIC_API_URL,
        process.env.API_URL,
        process.env.API_BASE_URL,
    ];

    for (const candidate of explicitCandidates) {
        const sanitized = sanitize(candidate);
        if (sanitized) {
            return sanitized;
        }
    }

    const siteCandidates = [
        process.env.NEXT_PUBLIC_SITE_URL,
        process.env.SITE_URL,
        process.env.NEXT_PUBLIC_APP_URL,
        process.env.APP_URL,
    ];

    for (const candidate of siteCandidates) {
        const sanitized = sanitize(candidate);
        if (sanitized) {
            return appendApiSegment(withProtocol(sanitized));
        }
    }

    const vercelHost = sanitize(process.env.NEXT_PUBLIC_VERCEL_URL) ?? sanitize(process.env.VERCEL_URL);
    if (vercelHost) {
        return appendApiSegment(withProtocol(vercelHost));
    }

    if (typeof window !== 'undefined') {
        const { hostname, protocol } = window.location;
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001/api';
        }

        if (protocol && hostname) {
            return `${protocol}//${hostname.replace(/\/$/, '')}/api`;
        }

        return '/api';
    }

    return 'http://localhost:3001/api';
};

// Helper function to check if we're in mock API mode
export const isMockApiMode = (): boolean => {
    return process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_API_URL;
};
