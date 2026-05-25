// JSON-RPC 2.0 error codes
export const RPC_ERRORS = {
  PARSE_ERROR: -32700,
  INVALID_REQUEST: -32600,
  METHOD_NOT_FOUND: -32601,
  INVALID_PARAMS: -32602,
  INTERNAL_ERROR: -32603,
} as const;

export interface JsonRpcError {
  code: number;
  message: string;
  data?: unknown;
}

export function rpcError(code: number, message: string, data?: unknown): JsonRpcError {
  return { code, message, ...(data !== undefined && { data }) };
}
