import { ApiError } from '../../types/api.types';
import { BACKEND_AUTH, BACKEND_CONFIG } from '../../constants/backend.constants';

// Fetch wrapper para o backend .NET. Injeta x-api-key + claim headers, faz
// timeout via AbortController e mapeia erros HTTP/envelopes para ApiError.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export interface BackendRequestOptions {
  method?: HttpMethod;
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  signal?: AbortSignal;
}

const BASE = `${BACKEND_CONFIG.baseUrl}${BACKEND_CONFIG.basePath}`;

function buildHeaders(hasBody: boolean): Record<string, string> {
  const headers: Record<string, string> = {
    'x-api-key': BACKEND_AUTH.apiKey,
    'x-corehub-claims-emailaddress': BACKEND_AUTH.claims.emailaddress,
    'x-corehub-claims-nameidentifier': BACKEND_AUTH.claims.nameidentifier,
    'x-corehub-claims-upn': BACKEND_AUTH.claims.upn,
    'x-corehub-claims-name': BACKEND_AUTH.claims.name,
    'x-corehub-claims-roles': BACKEND_AUTH.claims.roles,
    'x-corehub-claims-authorizationtoken': BACKEND_AUTH.claims.authorizationtoken,
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

// Os envelopes de erro do backend variam consoante o status:
//   400 → BooleanFriendlyResponseT { content: false, message }
//   401/403 → UnAuthorizedResponse/ForbiddenResponse { code, message }
//   404 → ProblemDetails { title, detail }
//   500 → ExceptionResponse { code, message }
// Tentamos extrair a mensagem mais informativa disponível.
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
    ? setTimeout(() => controller.abort(), BACKEND_CONFIG.timeoutMs)
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
      throw new ApiError(response.status, message);
    }

    // 204 No Content nunca devolvido pelo nosso contrato hoje, mas tratamos por
    // segurança caso o backend real opte por isso.
    if (response.status === 204) return undefined as T;
    return (await response.json()) as T;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, `Backend request timed out (${method} ${path})`);
    }
    console.error(`[backend] ${method} ${path} failed:`, err);
    throw new ApiError(500, err instanceof Error ? err.message : 'Backend call failed');
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
}
