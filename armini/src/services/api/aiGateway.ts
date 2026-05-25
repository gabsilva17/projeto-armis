import type { MCPRequest, MCPResponse } from '../../types/api.types';
import { ApiError } from '../../types/api.types';
import { AI_GATEWAY_CONFIG, AI_GATEWAY_METHODS } from '../../constants/llm.constants';
import type {
  McpChatSendParams,
  McpChatSendResult,
  McpBootstrapParams,
  McpBootstrapResult,
  McpScanParams,
  McpScanResult,
} from '../../types/mcp.types';

// JSON-RPC client for the AI Gateway (`ai-gateway/`). The envelope is still
// "MCP-shaped" so the existing MCPRequest/MCPResponse types are reused —
// the gateway exposes only chat/* methods; tool listing/execution lives on
// the MCP server (mcp/, port 3003) and the gateway speaks to it server-side.

const BASE_URL = `${AI_GATEWAY_CONFIG.baseUrl}${AI_GATEWAY_CONFIG.endpoint}`;

let _requestId = 0;

export async function aiGatewayCall<T>(
  method: string,
  params: object,
): Promise<T> {
  const request: MCPRequest = {
    jsonrpc: '2.0',
    id: ++_requestId,
    method,
    params,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), AI_GATEWAY_CONFIG.timeoutMs);

  try {
    const response = await fetch(BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ApiError(
        response.status,
        `AI Gateway error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as MCPResponse<T>;

    if (data.error) {
      throw new ApiError(data.error.code, data.error.message);
    }

    return data.result as T;
  } catch (err) {
    console.error(`[aiGateway] ${method} failed (url=${BASE_URL}):`, err);
    if (err instanceof ApiError) throw err;
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ApiError(408, 'AI Gateway request timed out');
    }
    throw new ApiError(500, err instanceof Error ? err.message : 'AI Gateway call failed');
  } finally {
    clearTimeout(timeout);
  }
}

// ── Typed wrappers ──────────────────────────────────────────────────

export function aiGatewayChatSend(params: McpChatSendParams): Promise<McpChatSendResult> {
  return aiGatewayCall<McpChatSendResult>(AI_GATEWAY_METHODS.CHAT_SEND, params);
}

export function aiGatewayBootstrap(params: McpBootstrapParams): Promise<McpBootstrapResult> {
  return aiGatewayCall<McpBootstrapResult>(AI_GATEWAY_METHODS.CHAT_BOOTSTRAP, params);
}

export function aiGatewayScan(params: McpScanParams): Promise<McpScanResult> {
  return aiGatewayCall<McpScanResult>(AI_GATEWAY_METHODS.CHAT_SCAN, params);
}
