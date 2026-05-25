import { env } from '../config/env.js';

// Fetch wrapper para o backend .NET (em dev é o mock-backend). Espelha o
// armini/src/services/backend/httpClient.ts: injecta x-api-key + claim
// headers, faz timeout via AbortController e mapeia erros para BackendError.
// É deliberadamente compacto — o MCP server é leitor/escritor server-side,
// não tem stores nem UI.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface BackendRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

export class BackendError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'BackendError';
  }
}

const BASE = `${env.BACKEND_URL}/api/v1`;

// Identidade de dev. O backend real exige x-api-key + claim headers, mas
// o mock aceita tudo sem validar. Valores fixos enquanto auth não está
// wired — ver REFACTOR_PLAN.md § Out of scope.
const DEV_CLAIMS = {
  emailaddress: `${env.BACKEND_USERNAME}@armis.local`,
  nameidentifier: env.BACKEND_USERNAME,
  upn: env.BACKEND_USERNAME,
  name: env.BACKEND_USERNAME,
  roles: 'user',
  authorizationtoken: 'dev-mock-token',
} as const;

function buildHeaders(hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'x-api-key': env.BACKEND_API_KEY,
    'x-corehub-claims-emailaddress': DEV_CLAIMS.emailaddress,
    'x-corehub-claims-nameidentifier': DEV_CLAIMS.nameidentifier,
    'x-corehub-claims-upn': DEV_CLAIMS.upn,
    'x-corehub-claims-name': DEV_CLAIMS.name,
    'x-corehub-claims-roles': DEV_CLAIMS.roles,
    'x-corehub-claims-authorizationtoken': DEV_CLAIMS.authorizationtoken,
    Accept: 'application/json',
  };
  if (hasBody) headers['Content-Type'] = 'application/json';
  return headers;
}

function buildUrl(path: string, query?: BackendRequestOptions['query']): string {
  const qs: string[] = [];
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined) continue;
      qs.push(`${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`);
    }
  }
  return qs.length ? `${BASE}${path}?${qs.join('&')}` : `${BASE}${path}`;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object') {
      const obj = body as Record<string, unknown>;
      if (typeof obj.detail === 'string') return obj.detail;
      if (typeof obj.message === 'string') return obj.message;
      if (typeof obj.title === 'string') return obj.title;
    }
  } catch {
    // body não é JSON — cai no fallback de status text.
  }
  return `${response.status} ${response.statusText}`;
}

export async function backendRequest<T>(
  path: string,
  opts: BackendRequestOptions = {},
): Promise<T> {
  const method = opts.method ?? 'GET';
  const url = buildUrl(path, opts.query);
  const hasBody = opts.body !== undefined;

  const controller = opts.signal ? undefined : new AbortController();
  const timeoutId = controller
    ? setTimeout(() => controller.abort(), env.BACKEND_TIMEOUT_MS)
    : undefined;

  try {
    const response = await fetch(url, {
      method,
      headers: buildHeaders(hasBody),
      body: hasBody ? JSON.stringify(opts.body) : undefined,
      signal: opts.signal ?? controller?.signal,
    });

    if (!response.ok) {
      const message = await extractErrorMessage(response);
      throw new BackendError(response.status, message);
    }

    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof BackendError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new BackendError(408, `Backend request timed out (${method} ${path})`);
    }
    throw new BackendError(500, err instanceof Error ? err.message : 'Backend call failed');
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
