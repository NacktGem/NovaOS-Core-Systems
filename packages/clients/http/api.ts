export type ApiOptions = RequestInit & { retry?: number };

function getCsrf(): string | null {
  const match = document.cookie.split('; ').find(c => c.startsWith('csrf='));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

async function attempt<T>(url: string, init: RequestInit, retry: number): Promise<T> {
  try {
    const res = await fetch(url, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const type = res.headers.get('content-type') || '';
    if (type.includes('application/json')) return (await res.json()) as T;
    return (await res.text()) as unknown as T;
  } catch (err) {
    if (init.method && init.method !== 'GET') throw err;
    if (retry <= 0) throw err;
    const delay = Math.min(200 * 2 ** (3 - retry), 2000);
    await new Promise(r => setTimeout(r, delay));
    return attempt<T>(url, init, retry - 1);
  }
}

 export async function apiFetch<T = unknown>(url: string, options: ApiOptions = {}): Promise<T> {
  const { retry = 3, headers, ...rest } = options;
  const init: RequestInit = {
    credentials: 'include',
    ...rest,
    headers: { ...(headers || {}) },
  };
  const csrf = getCsrf();
  if (csrf) (init.headers as Record<string, string>)['x-csrf-token'] = csrf;
  return attempt<T>(url, init, retry);
}

export function fireAnalytics(event_name: string, data: Record<string, unknown> = {}): void {
  const body = JSON.stringify({ event_name, ...data });
  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/analytics/ingest', body);
    } else {
      fetch('/analytics/ingest', {
        method: 'POST',
        body,
        headers: { 'content-type': 'application/json' },
        keepalive: true,
      }).catch(err => {
        if (process.env.NODE_ENV === 'development') console.debug('analytics failed', err);
      });
    }
  } catch (err) {
    if (process.env.NODE_ENV === 'development') console.debug('analytics failed', err);
  }
}
