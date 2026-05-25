import type { RequestHandler } from 'express';

const CLAIM_HEADERS = [
  'x-corehub-claims-emailaddress',
  'x-corehub-claims-nameidentifier',
  'x-corehub-claims-upn',
  'x-corehub-claims-name',
  'x-corehub-claims-roles',
  'x-corehub-claims-authorizationtoken',
] as const;

export type ClaimHeaderName = (typeof CLAIM_HEADERS)[number];

declare module 'express-serve-static-core' {
  interface Request {
    claims?: Partial<Record<ClaimHeaderName, string>>;
    apiKey?: string;
  }
}

// O backend real exige x-api-key + claim headers para identificar o utilizador.
// O mock aceita tudo (sem validação) mas expõe os valores em req.claims para
// que possamos espreitar nos logs e detectar más integrações cedo.
export const claimsHeaders: RequestHandler = (req, _res, next) => {
  req.apiKey = typeof req.headers['x-api-key'] === 'string' ? req.headers['x-api-key'] : undefined;
  const claims: Partial<Record<ClaimHeaderName, string>> = {};
  for (const name of CLAIM_HEADERS) {
    const v = req.headers[name];
    if (typeof v === 'string') claims[name] = v;
  }
  req.claims = claims;
  next();
};
