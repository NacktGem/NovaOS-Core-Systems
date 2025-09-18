import 'server-only';

import { cookies } from 'next/headers';

const DEFAULT_BASE = 'http://localhost:8760';
const AGENT_TOKEN = process.env.AGENT_SHARED_TOKEN ?? '';

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

type FetchOptions = {
  includeAgentToken?: boolean;
};

export async function coreApiFetch(
  path: string,
  init: RequestInit = {},
  options: FetchOptions = {},
): Promise<Response> {
  const cookieHeader = cookies().toString();
  const headers = new Headers(init.headers ?? {});
  if (cookieHeader) {
    headers.set('cookie', cookieHeader);
  }
  if (!headers.has('accept')) {
    headers.set('accept', 'application/json');
  }
  if (options.includeAgentToken) {
    if (!AGENT_TOKEN) {
      throw new Error('AGENT_SHARED_TOKEN must be configured for nova-console');
    }
    headers.set('x-agent-token', AGENT_TOKEN);
  }
  const res = await fetch(`${coreApiBase()}${path}`, {
    ...init,
    headers,
    cache: 'no-store',
  });
  return res;
}

export async function coreApiJson<T>(
  path: string,
  init: RequestInit = {},
  options: FetchOptions = {},
): Promise<T> {
  const res = await coreApiFetch(path, init, options);
  let payload: unknown = null;
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    payload = await res.json();
  } else if (contentType.startsWith('text/')) {
    payload = await res.text();
  }
  if (!res.ok) {
    throw new CoreApiError(`Core API request failed (${res.status})`, res.status, payload);
  }
  return payload as T;
}
