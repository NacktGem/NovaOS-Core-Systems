import 'server-only';

import { cookies } from 'next/headers';

const DEFAULT_BASE = 'http://localhost:8760';

export class CoreApiError extends Error {
  status: number;
  payload: unknown;

  constructor(message: string, status: number, payload: unknown) {
    super(message);
    this.name = 'CoreApiError';
    this.status = status;
    this.payload = payload;
  }
}

export function coreApiBase(): string {
  const base = process.env.CORE_API_BASE ?? DEFAULT_BASE;
  return base.replace(/\/+$/, '');
}

export async function coreApiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const cookieHeader = cookies().toString();
  const headers = new Headers(init.headers ?? {});
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }
  const res = await fetch(`${coreApiBase()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  return res;
}

export async function coreApiJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await coreApiFetch(path, init);
  let payload: unknown = null;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    payload = await res.json();
  } else if (contentType.startsWith('text/')) {
    payload = await res.text();
  }
  if (!res.ok) {
    throw new CoreApiError(
      `Core API request failed with status ${res.status}`,
      res.status,
      payload,
    );
  }
  return payload as T;
}
