const API_BASE = process.env.NOVA_API_URL || '';
async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        credentials: 'include',
        ...options,
    });
    if (!res.ok)
        throw new Error(`API request failed: ${res.status}`);
    return res.json();
}
export async function getMe() {
    return apiFetch('/me');
}
export async function getFeatureFlags() {
    return apiFetch('/feature-flags');
}
export async function getPalettes() {
    return apiFetch('/me/palettes');
}
export async function getSovereignStatus() {
    return apiFetch('/me/sovereign');
}
export async function subscribe(tierKey) {
    return apiFetch('/billing/subscribe', {
        method: 'POST',
        body: JSON.stringify({ tier_key: tierKey }),
    });
}
export async function buyPalette(key) {
    return apiFetch(`/billing/palette/${key}/buy`, {
        method: 'POST',
    });
}
export async function conciergeAsk(prompt) {
    return apiFetch('/concierge/ask', {
        method: 'POST',
        body: JSON.stringify({ prompt }),
    });
}
