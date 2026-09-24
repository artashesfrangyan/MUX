import type { Credentials } from './types';

export type HttpMethod = 'GET' | 'POST' | 'DELETE';

export interface TransportRequest {
  credentials: Credentials;
  method: string;
  httpMethod: HttpMethod;
  pathParam?: string;
  query?: Record<string, string>;
  body?: unknown;
  signal: AbortSignal;
}

export interface TransportResponse {
  status: number;
  text: string;
}

export type Transport = (request: TransportRequest) => Promise<TransportResponse>;

export function buildUrl({
  credentials,
  method,
  pathParam,
  query,
}: Pick<TransportRequest, 'credentials' | 'method' | 'pathParam' | 'query'>): string {
  const { apiUrl, idInstance, apiTokenInstance } = credentials;
  const path = `${apiUrl}/waInstance${idInstance}/${method}/${apiTokenInstance}`;
  const param = pathParam === undefined ? '' : `/${encodeURIComponent(pathParam)}`;
  const search = query ? `?${new URLSearchParams(query).toString()}` : '';
  return `${path}${param}${search}`;
}

export const fetchTransport: Transport = async (request) => {
  const { httpMethod, body, signal } = request;
  const response = await fetch(buildUrl(request), {
    method: httpMethod,
    headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal,
  });
  return { status: response.status, text: await response.text() };
};
