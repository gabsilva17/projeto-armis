import type { MCPRequest, MCPResponse } from '../../types/api.types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000';

let _requestId = 0;

// TODO: When the MCP backend is ready, implement this function.
// It should POST a JSON-RPC 2.0 request to BASE_URL/mcp and return the result.
export async function mcpCall<T>(
  method: string,
  params: Record<string, unknown>,
): Promise<T> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    id: ++_requestId,
    method,
    params,
  };

  // Placeholder — replace with: const response = await fetch(`${BASE_URL}/mcp`, { method: 'POST', body: JSON.stringify(request) });
  throw new Error(
    `Backend not connected. Would call ${BASE_URL}/mcp → ${request.method}`,
  );
}
