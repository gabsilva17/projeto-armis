import Constants from 'expo-constants';

// Wire-level config para o backend .NET (mockado em dev por mock-backend/).
// Swap mock → real backend é apenas mudar EXPO_PUBLIC_BACKEND_URL no .env do app.

const BACKEND_PORT = 3002;

function resolveBackendBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_BACKEND_URL) return process.env.EXPO_PUBLIC_BACKEND_URL;

  // Em dev seguimos o IP da máquina via Metro (mesmo padrão do MCP_CONFIG).
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${BACKEND_PORT}`;
  }

  return `http://localhost:${BACKEND_PORT}`;
}

export const BACKEND_CONFIG = {
  baseUrl: resolveBackendBaseUrl(),
  basePath: '/api/v1',
  timeoutMs: 30_000,
} as const;

// Stub de identidade. O backend real requer x-api-key + x-corehub-claims-*.
// A wiring real (login, refresh, etc.) sai do scope deste refactor — ver
// REFACTOR_PLAN.md § Out of scope. Para já enviamos valores fixos de dev,
// que o mock aceita sem validar.
export const BACKEND_AUTH = {
  apiKey: process.env.EXPO_PUBLIC_BACKEND_API_KEY ?? 'dev-mock-key',
  claims: {
    emailaddress: 'gabriel@armis.local',
    nameidentifier: 'gabriel',
    upn: 'gabriel',
    name: 'Gabriel',
    roles: 'user',
    authorizationtoken: 'dev-mock-token',
  },
} as const;
