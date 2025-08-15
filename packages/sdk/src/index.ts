const API_BASE = process.env.NOVA_API_URL || '';

async function apiFetch(path: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) throw new Error(`API request failed: ${res.status}`);
  return res.json();
}

export async function getMe() {
  return apiFetch('/me');
}

export async function getFeatureFlags() {
  return apiFetch('/feature-flags');
}

export async function getPalettes() {
  return apiFetch('/palettes');
}

export async function getSovereignStatus() {
  return apiFetch('/sovereign/status');
}

export async function subscribe(tierKey: string) {
  return apiFetch('/billing/subscribe', {
    method: 'POST',
    body: JSON.stringify({ tierKey }),
  });
}

export async function buyPalette(key: string) {
  return apiFetch(`/billing/palette/${key}/buy`, {
    method: 'POST',
  });
}

export async function conciergeAsk(prompt: string) {
  return apiFetch('/concierge/ask', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
}
