import type { ApiErrorBody } from './types';

const DEFAULT_BASE = '/api/v1';

export function getApiBase(): string {
  return localStorage.getItem('dental.devui.baseUrl') || DEFAULT_BASE;
}

export class ApiError extends Error {
  status: number;
  details?: string[];

  constructor(status: number, message: string, details?: string[]) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiRequest<T>(
  method: string,
  path: string,
  options: {
    token?: string | null;
    body?: unknown;
    query?: Record<string, string | number | boolean | undefined | null>;
  } = {},
): Promise<T> {
  const base = getApiBase();
  const qs = new URLSearchParams();
  if (options.query) {
    for (const [key, value] of Object.entries(options.query)) {
      if (value === undefined || value === null || value === '') continue;
      qs.set(key, String(value));
    }
  }
  const queryString = qs.toString();
  const url = `${base}${path}${queryString ? `?${queryString}` : ''}`;

  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the API. Is the server running on port 3000?');
  }

  const raw = await response.text();
  let data: unknown = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const err = data as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      err?.message || `Request failed (${response.status})`,
      err?.details,
    );
  }

  return data as T;
}
